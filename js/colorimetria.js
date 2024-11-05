document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;

    // Seleccionar el contenido del contenedor específico
    const content = document.getElementById('contenedor');

    if (!content) {
      console.error('El contenedor no se encuentra en el DOM.');
      return;
    }

    // Crear una instancia de jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Obtener todos los elementos de texto e imágenes dentro del contenedor
    const elements = content.querySelectorAll('h2, h3, p, img');

    let yPosition = 10; // Posición inicial en el PDF

    elements.forEach(element => {
      if (element.tagName === 'H2') {
        pdf.setFontSize(16);
        pdf.text(element.innerText, 10, yPosition);
        yPosition += 10; // Incrementar la posición para el siguiente elemento
      } else if (element.tagName === 'H3') {
        pdf.setFontSize(14);
        pdf.text(element.innerText, 10, yPosition);
        yPosition += 10;
      } else if (element.tagName === 'P') {
        pdf.setFontSize(12);
        pdf.text(element.innerText, 10, yPosition);
        yPosition += 8;
      } else if (element.tagName === 'IMG') {
        // Si es una imagen, la añadimos al PDF
        const imgData = element.src;
        pdf.addImage(imgData, 'JPEG', 10, yPosition, 30, 30);
        yPosition += 35; // Ajustar la posición después de la imagen
      }

      // Si la posición supera el límite de la página, añadir una nueva página
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 10; // Reiniciar la posición en la nueva página
      }
    });

    // Descargar el archivo PDF
    pdf.save('informacion.pdf');
  });
});
