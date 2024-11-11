
const DATABASE_URL = 'https://detectorglucosa-backend.onrender.com';

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${DATABASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Error al iniciar sesión');
      return;
    }

    const loginData = await response.json();
    const decodedToken = jwt_decode(loginData.accessToken);

    localStorage.setItem('isUserLogged', 'true');
    localStorage.setItem('token', loginData.accessToken);

    // Configura los datos del usuario en el localStorage
    localStorage.setItem('diabetes', decodedToken.diabetes);
    localStorage.setItem('usuario', decodedToken.id);

    // Redirige al usuario a la página de inicio
    window.location.href = '../index.html';

  } catch (error) {
    console.error('Error:', error);
    alert('Error al conectar con el servidor');
  }
});
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
