const passwordField = document.getElementById("password");

function togglePasswordVisibility() {
  const togglePasswordButton = document.getElementById("togglePassword");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    togglePasswordButton.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
  } else {
    passwordField.type = "password";
    togglePasswordButton.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
  }
}
const togglePasswordButton = document.getElementById("togglePassword");

togglePasswordButton.addEventListener('click', togglePasswordVisibility);

const DATABASE_URL = 'https://detectorglucosa-backend.onrender.com';

document.getElementById('todo-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const nombre = document.getElementById('user').value;
  const diabetes = document.getElementById('choice').value;
  // Almacenar el dato en localStorage
  localStorage.setItem('diabetes', diabetes);
  localStorage.setItem('isUserLogged', 'true');
  try {
    const response = await fetch(`${DATABASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, email, password, diabetes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de respuesta:', errorData); // Agrega esto para más información
      alert(errorData.message || 'Error en el registro');
      return;
    }
    // Redirige al usuario a la página de inicio
    window.location.href = 'http://127.0.0.1:5500/proyecto-agos/pages/login.html';
  } catch (error) {
    console.error('Error:', error);
    alert('Error al conectar con el servidor');
  }
});
