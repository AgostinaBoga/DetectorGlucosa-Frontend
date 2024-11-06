function onOpenCvReady() {
  const logueado = localStorage.getItem('isUserLogged');
  console.log('OpenCV.js loaded');
  renderGlucoseChart()
  document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
  if (!logueado) {
    document.getElementById('boton-file').classList.add('d-none'); // Ocultar el botón de subir archivo
    document.getElementById('loginButton').classList.remove('d-none'); // Mostrar el botón de Back
    document.getElementById('desaparece').classList.add('d-none');
    document.getElementById('aparece').classList.remove('d-none');
    document.getElementById('aparece1').classList.remove('d-none');
  }
}
function logout() {
  localStorage.clear();
}
const DATABASE_URL = 'https://detectorglucosa-backend.onrender.com';
async function processImage(image) {
  const canvas = document.getElementById('outputCanvas');
  const ctx = canvas.getContext('2d');
  // Definir un tamaño máximo para el canvas
  const maxWidth = 300; // Ancho máximo deseado
  const maxHeight = 300; // Alto máximo deseado

  // Calcular la relación de aspecto de la imagen
  const aspectRatio = image.width / image.height;

  // Calcular el nuevo tamaño basado en la relación de aspecto
  let newWidth, newHeight;
  if (image.width > image.height) {
    newWidth = Math.min(maxWidth, image.width);
    newHeight = newWidth / aspectRatio;
  } else {
    newHeight = Math.min(maxHeight, image.height);
    newWidth = newHeight * aspectRatio;
  }

  // Establecer el tamaño del canvas
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Calcular las posiciones para centrar la imagen en el canvas
  const xOffset = (maxWidth - newWidth) / 2;
  const yOffset = (maxHeight - newHeight) / 2;

  // Dibujar la imagen escalada y centrada en el canvas
  ctx.drawImage(image, xOffset, yOffset, newWidth, newHeight);

  // Convertir la imagen a un objeto Mat de OpenCV.js
  const src = cv.imread(canvas);

  // Convertir la imagen a HSV
  const hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  // Definir el rango de color azul en HSV
  const lowerBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 50, 50, 0]);
  const upperBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [130, 255, 255, 255]);

  // Rango para colores verdes
  const lowerGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 50, 50, 0]);
  const upperGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [85, 255, 255, 255]);

  // Crear máscaras para verdes y azules
  let maskGreen = new cv.Mat();
  let maskBlue = new cv.Mat();
  cv.inRange(hsv, lowerGreen, upperGreen, maskGreen);
  cv.inRange(hsv, lowerBlue, upperBlue, maskBlue);

  // Combinar las máscaras para obtener una única máscara que incluya ambos colores
  let mask = new cv.Mat();
  cv.bitwise_or(maskGreen, maskBlue, mask);

  // Aplicar umbralización
  const dst = new cv.Mat();
  cv.threshold(mask, dst, 100, 255, cv.THRESH_BINARY);

  // Calcular la intensidad del color
  let intensity = Number(cv.countNonZero(dst));
  let glucosa = Math.trunc(intensity * 0.413 - 31.2);
  if (glucosa < 0) {
    document.getElementById("colorIntensity").textContent = 0 + ' mg/dl';
  } else {
    document.getElementById("colorIntensity").textContent = glucosa + ' mg/dl';
  }

  // Mostrar el resultado en el canvas
  cv.imshow(canvas, dst);
  const concentracion = glucosa;
  const usuarioId = localStorage.getItem('usuario');
  try {
    const response = await fetch(`${DATABASE_URL}/glucose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ concentracion, usuarioId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de respuesta:', errorData); // Agrega esto para más información
      alert(errorData.message || 'Error en el almacenamiento de datos ');
      return;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al conectar con el servidor');
  }

  // Actualizar la rueda de intensidad
  if (glucosa < 0) {
    updateIntensityCircle(0);
  } else {
    updateIntensityCircle(glucosa);
  }
  renderGlucoseChart()
  // Liberar memoria
  src.delete();
  hsv.delete();
  lowerBlue.delete();
  upperBlue.delete();
  mask.delete();
  maskGreen.delete();
  maskBlue.delete();
  dst.delete();
}

// Llama a esta función cuando la página se cargue
window.onload = function () {
  drawEmptyCircle(); // Dibuja el círculo vacío al cargar
};

function updateIntensityCircle(intensity) {
  // Recuperar el dato en la página de destino
  const diabInput = localStorage.getItem('diabetes');

  let maxIntensity;
  if (diabInput.value === 'true') {
    maxIntensity = 180; // 80-130mg/dl (normal), <180mg/dl (2h despues de comer) 
  } else {
    maxIntensity = 180;//70-100mg/dl, <140mg/dl (2h despues de comer) , los dos llegan a 180 pero los porcentajes cambian
  }
  const percentage = Math.min(intensity / maxIntensity, 1) * 100;

  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');

  // Establecer el tamaño del canvas
  canvas.width = 200; // Ancho del canvas
  canvas.height = 200; // Alto del canvas

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 90; // Radio del círculo
  const startAngle = -0.5 * Math.PI; // Comenzar en la parte superior
  const endAngle = startAngle + (2 * Math.PI * (percentage / 100));

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el anillo exterior que representa las zonas de bajo, normal y alto
  const outerRadius = radius - 20; // Radio exterior
  const innerRadius = radius - 10;  // Radio interior

  // Dibujar la zona "Bajo"
  ctx.beginPath();
  if (diabInput.value === 'true') {
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + (2 * Math.PI * 0.44));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.44), startAngle, true);
  } else {
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + (2 * Math.PI * 0.5));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.50), startAngle, true);
  }

  ctx.closePath();
  ctx.fillStyle = '#f27f1b';
  ctx.fill();

  // Dibujar la zona "Normal"
  ctx.beginPath();
  if (diabInput.value === 'true') {
    ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.44), startAngle + (2 * Math.PI * 0.72));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.72), startAngle + (2 * Math.PI * 0.44), true);
  } else {
    ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.5), startAngle + (2 * Math.PI * 0.71));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.71), startAngle + (2 * Math.PI * 0.5), true);
  }
  ctx.closePath();
  ctx.fillStyle = '#1bf222';
  ctx.fill();

  // Dibujar la zona "Alto"
  ctx.beginPath();
  if (diabInput.value === 'true') {
    ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.72), startAngle + (2 * Math.PI));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI), startAngle + (2 * Math.PI * 0.72), true);
  } else {
    ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.71), startAngle + (2 * Math.PI));
    ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI), startAngle + (2 * Math.PI * 0.71), true);
  }
  ctx.closePath();
  ctx.fillStyle = '#f21b1b';
  ctx.fill();

  // Dibujar el fondo del círculo de progreso
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el fondo del círculo
  ctx.lineWidth = 10;
  ctx.stroke();

  // Dibujar el círculo de progreso con el color determinado
  let color;
  let text;
  if (diabInput.value === 'true') {
    if (percentage <= 44) {
      color = '#82c6ed';
      text = 'Glucosa Baja';
    } else if (percentage <= 78) {
      color = '#55b8f2';
      text = 'Normal';
    } else {
      color = '#1f75a6';
      text = 'Glucosa Alta';
    }
  } else {
    if (percentage <= 50) {
      color = '#82c6ed';
      text = 'Glucosa Baja';
    } else if (percentage <= 72) {
      color = '#55b8f2';
      text = 'Normal';
    } else {
      color = '#1f75a6';
      text = 'Glucosa Alta';
    }
  }
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Mostrar la intensidad en el centro
  ctx.font = '22px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(intensity + ' mg/dl', centerX, centerY);

  // Mostrar el texto debajo del círculo
  const statusText = document.getElementById('statusText');
  statusText.textContent = text;
  statusText.style.color = color;
  statusText.style.fontSize = '20px'; // Aumentar el tamaño de la letra
  // statusText.style.fontWeight = 'bold'; // Hacer la letra en negrita

  // Ajustar el tamaño del contenedor
  const appContainer = document.getElementById('app');
  appContainer.classList.add('expanded'); // Agregar clase para agrandar el contenedor
}

function drawCircle(intensity) {
  const canvas = document.getElementById('intensityCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 90; // Radio del círculo
  const outerRadius = radius - 20; // Radio exterior
  const innerRadius = radius - 10;  // Radio interior

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Definimos el ángulo inicial
  const startAngle = -0.5 * Math.PI; // Comenzar en la parte superior

  // Dibujar la zona "Bajo"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + (2 * Math.PI * 0.5));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.50), startAngle, true);
  ctx.closePath();
  ctx.fillStyle = '#f27f1b';
  ctx.fill();

  // Dibujar la zona "Normal"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.5), startAngle + (2 * Math.PI * 0.71));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI * 0.71), startAngle + (2 * Math.PI * 0.5), true);
  ctx.closePath();
  ctx.fillStyle = '#1bf222';
  ctx.fill();

  // Dibujar la zona "Alto"
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle + (2 * Math.PI * 0.71), startAngle + (2 * Math.PI));
  ctx.arc(centerX, centerY, innerRadius, startAngle + (2 * Math.PI), startAngle + (2 * Math.PI * 0.71), true);
  ctx.closePath();
  ctx.fillStyle = '#f21b1b';
  ctx.fill();
  // Dibujar el fondo del círculo de progreso
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E0E0E0'; // Color gris para el fondo del círculo
  ctx.lineWidth = 10;
  ctx.stroke();


  // Añadir el texto de intensidad en el centro
  ctx.font = '22px Arial';
  ctx.fillStyle = '#3AB0A6'; // Color del texto
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(intensity + ' mg/dl', centerX, centerY);
}

// Llama a drawCircle con un valor de intensidad al cargar
window.onload = function () {
  drawCircle(0); // Dibuja el círculo vacío al cargar
};

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      processImage(this);
      document.getElementById('boton-file').classList.add('d-none'); // Ocultar el botón de subir archivo
      document.getElementById('backButton').classList.remove('d-none'); // Mostrar el botón de Back
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// Función para el botón de Back
document.getElementById('backButton').addEventListener('click', function () {
  location.reload(); // Recargar la página para reiniciar
});
// Crear el gráfico
// Variables iniciales
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const glucoseLevels = new Array(7).fill(0); // Niveles de glucosa iniciales para cada día

// Crear el gráfico inicial sin datos
const ctx = document.getElementById('glucoseChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: daysOfWeek,
    datasets: [{
      label: 'Concentración de Glucosa',
      data: glucoseLevels,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nivel de Glucosa (mg/dL)',
          color: 'rgba(0, 0, 0,1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Días de la Semana',
          color: 'rgba(0, 0, 0,1)'
        }
      }
    }
  }
});
async function renderGlucoseChart() {
  const usuarioId = localStorage.getItem('usuario');

  try {
    const response = await fetch(`${DATABASE_URL}/glucose`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los datos de glucosa');
    }

    const glucoseData = await response.json();

    // Variables para definir la semana actual
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Inicio de la semana (domingo)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Fin de la semana (sábado)

    // Inicializa el array para almacenar los niveles de glucosa de cada día de la semana actual
    const glucoseLevels = new Array(7).fill(0);

    // Filtra y asigna los datos de glucosa de la semana actual a cada día correspondiente
    glucoseData.forEach(data => {
      const date = new Date(data.fecha);
      const day = date.getDay(); // Obtiene el día de la semana (0 = domingo, 6 = sábado)

      // Comprueba que el dato sea del usuario actual y de la semana actual
      if (
        data.usuario.toString() === usuarioId &&
        date >= currentWeekStart &&
        date <= currentWeekEnd &&
        day >= 0 && day < 7
      ) {
        glucoseLevels[day] = data.concentracion; // Asigna el valor de glucosa al día correspondiente de la semana
      }
    });

    // Actualiza los datos del gráfico
    myChart.data.datasets[0].data = glucoseLevels;
    myChart.update(); // Redibuja el gráfico con los datos actualizados

  } catch (error) {
    console.error('Error:', error);
  }
}
