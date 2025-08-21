const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
  alert('No estás autenticado');
  window.location.href = 'login.html';
}

let decoded;
let usuarioRol = 'user';

// Decodificar token para obtener info del usuario
decoded = JSON.parse(atob(token.split('.')[1]));
usuarioRol = decoded.rol || 'user';

// Mostrar mensaje de bienvenida
const bienvenidaElem = document.getElementById('bienvenida');
if (bienvenidaElem) {
  bienvenidaElem.textContent = `Bienvenido ${usuarioRol === 'admin' ? 'Admin' : 'Usuario'} ${decoded.nombre || ''}`;
  if (usuarioRol === 'admin') {
    document.getElementById('adminSection').style.display = 'block';
  }
}

// Registro de usuario
function register() {
  fetch(`${API}/usuarios/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      rol: document.getElementById('rol').value
    })
  })
  .then(res => res.json())
  .then(result => alert(result.mensaje || JSON.stringify(result)));
}

// Login de usuario
function login() {
  fetch(`${API}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location = 'dashboard.html';
    } else {
      alert(data.mensaje || 'Credenciales incorrectas');
    }
  });
}

// Cargar servicios en select y lista
async function cargarServicios() {
  const res = await fetch(`${API}/servicios`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const servicios = await res.json();

  // Llenar select de reserva
  const select = document.getElementById('servicio');
  if (select) {
    select.innerHTML = '';
    servicios.forEach(s => {
      const option = document.createElement('option');
      option.value = s._id;
      option.textContent = s.nombre;
      select.appendChild(option);
    });
  }

  // Llenar lista de servicios (solo admin con botón eliminar)
  const ulServicios = document.getElementById('listaServicios');
  if (ulServicios) {
    ulServicios.innerHTML = '';
    servicios.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.nombre;

      if (usuarioRol === 'admin') {
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.marginLeft = '10px';
        btnEliminar.addEventListener('click', () => eliminarServicio(s._id));
        li.appendChild(btnEliminar);
      }

      ulServicios.appendChild(li);
    });
  }
}

// Crear reserva
async function reservar() {
  const data = {
    servicioId: document.getElementById('servicio').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value
  };

  const res = await fetch(`${API}/reservas`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  alert(result.mensaje || 'Reserva creada');
  cargarReservas();
}

// Cargar reservas
async function cargarReservas() {
  const url = usuarioRol === 'admin' ? `${API}/reservas` : `${API}/reservas/${decoded.id}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reservas = await res.json();

  const ul = document.getElementById('listaReservas') || document.getElementById('misReservas');
  if (ul) {
    ul.innerHTML = '';
    reservas.forEach(r => {
      const li = document.createElement('li');
      li.textContent = `${r.servicioId?.nombre || 'Servicio'} - ${r.fecha} ${r.hora}`;

      // Admin puede eliminar reservas
      if (usuarioRol === 'admin') {
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.marginLeft = '10px';
        btnEliminar.addEventListener('click', () => eliminarReserva(r._id));
        li.appendChild(btnEliminar);
      }

      ul.appendChild(li);
    });
  }
}

// Eliminar reserva (solo admin)
async function eliminarReserva(id) {
  if (!confirm('¿Seguro que quieres eliminar esta reserva?')) return;
  const res = await fetch(`${API}/reservas/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    alert('Reserva eliminada');
    cargarReservas();
  } else {
    alert('Error al eliminar reserva');
  }
}

// Eliminar servicio (solo admin)
async function eliminarServicio(id) {
  if (!confirm('¿Seguro que quieres eliminar este servicio?')) return;
  const res = await fetch(`${API}/servicios/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    alert('Servicio eliminado');
    cargarServicios();
  } else {
    alert('Error al eliminar servicio');
  }
}

// Logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// Formularios
document.getElementById('formReserva')?.addEventListener('submit', e => {
  e.preventDefault();
  reservar();
});

document.getElementById('formServicio')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = { nombre: document.getElementById('nombreServicio').value };
  const res = await fetch(`${API}/servicios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    alert('Servicio agregado');
    cargarServicios();
  } else {
    alert('Error agregando servicio');
  }
});

// Inicializar dashboard
(async () => {
  await cargarServicios();
  await cargarReservas();
})();
