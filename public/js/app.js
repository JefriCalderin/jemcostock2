const API_URL = '/api';

let currentUser = null;
let token = localStorage.getItem('jemco_token');
let modalsSetup = false;
let navigationSetup = false;
let filtersSetup = false;

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

function showError(message) {
  alert(message);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBadgeClass(estatus) {
  const map = {
    'Reparada': 'badge-estatus-reparada',
    'Repuestos': 'badge-estatus-repuestos',
    'Revision': 'badge-estatus-en-revision',
    'Testear': 'badge-estatus-por-testear',
    'Prestada': 'badge-estatus-prestada',
    'Funcional': 'badge-estatus-funcional'
  };
  return map[estatus] || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  const logoutBtn = document.getElementById('logout-btn');

  if (token) {
    checkAuth();
  }

  async function checkAuth() {
    try {
      const data = await apiCall('/tarjetas');
      currentUser = JSON.parse(localStorage.getItem('jemco_user'));
      showApp();
    } catch (error) {
      token = null;
      localStorage.removeItem('jemco_token');
      localStorage.removeItem('jemco_user');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
      const data = await apiCall('/login', 'POST', { username, password });
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('jemco_token', token);
      localStorage.setItem('jemco_user', JSON.stringify(currentUser));
      showApp();
    } catch (error) {
      errorDiv.textContent = error.message;
    }
  });

  logoutBtn.addEventListener('click', () => {
    token = null;
    currentUser = null;
    localStorage.removeItem('jemco_token');
    localStorage.removeItem('jemco_user');
    loginScreen.classList.remove('hidden');
    app.classList.add('hidden');
  });

  function showApp() {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    document.getElementById('user-badge').textContent = currentUser.rol === 'admin' ? `${currentUser.nombre} (${currentUser.rol})` : currentUser.nombre;

    // Ocultar por defecto todos los elementos del menú
    document.getElementById('nav-usuarios').style.display = 'none';
    document.getElementById('nav-logs').style.display = 'none';

    // Solo admin ve usuarios, logs y cambiar logo
    if (currentUser.rol === 'admin') {
      document.getElementById('nav-usuarios').style.display = 'flex';
      document.getElementById('nav-logs').style.display = 'flex';
    }

    initApp();
  }

  function initApp() {
    loadTarjetas();
    if (!navigationSetup) {
      setupNavigation();
      navigationSetup = true;
    }
    if (!modalsSetup) {
      setupModals();
      modalsSetup = true;
    }
    if (!filtersSetup) {
      setupFilters();
      filtersSetup = true;
    }
  }

  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const viewTitle = document.getElementById('view-title');

    const titles = {
      lugava: 'Lugava - Registro de Tarjetas',
      historial: 'Historial de Tarjetas',
      estadisticas: 'Estadísticas',
      usuarios: 'Gestión de Usuarios',
      logs: 'Registro de Actividad'
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        viewTitle.textContent = titles[view];

        if (view === 'lugava') loadTarjetas();
        if (view === 'historial') document.getElementById('buscar-historial').value = '';
        if (view === 'estadisticas') loadEstadisticas();
        if (view === 'usuarios') loadUsuarios();
        if (view === 'logs') loadLogs();

closeSidebar();
      });
    });

    // Event listener para el botón de menú hamburguesa
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', toggleSidebar);
    }

    // Cerrar sidebar al hacer click fuera en móvil
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('menu-toggle');
      if (window.innerWidth <= 768 && 
          sidebar && 
          sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && 
          !toggle.contains(e.target)) {
        closeSidebar();
      }
    });
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar').classList.toggle('sidebar-overlay');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar').classList.remove('sidebar-overlay');
  }

  function setupModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        document.getElementById(modalId).classList.add('hidden');
      });
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });

    document.getElementById('btn-nueva-tarjeta').addEventListener('click', () => {
      document.getElementById('modal-tarjeta-titulo').textContent = 'Nueva Tarjeta';
      document.getElementById('form-tarjeta').reset();
      document.getElementById('tarjeta-id').value = '';
      document.getElementById('modal-tarjeta').classList.remove('hidden');
    });

    document.getElementById('form-tarjeta').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('tarjeta-id').value;
      const data = {
        modelo: document.getElementById('tarjeta-modelo').value,
        serial: document.getElementById('tarjeta-serial').value,
        s1: document.getElementById('tarjeta-s1').value,
        s2: document.getElementById('tarjeta-s2').value,
        descripcion: document.getElementById('tarjeta-descripcion').value,
        ubicacion: document.getElementById('tarjeta-ubicacion').value,
        estatus: document.getElementById('tarjeta-estatus').value,
        empresa: document.getElementById('tarjeta-empresa').value
      };

      try {
        if (id) {
          await apiCall(`/tarjetas/${id}`, 'PUT', data);
        } else {
          await apiCall('/tarjetas', 'POST', data);
        }
        document.getElementById('modal-tarjeta').classList.add('hidden');
        loadTarjetas();
      } catch (error) {
        showError(error.message);
      }
    });

    document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
      document.getElementById('modal-usuario-titulo').textContent = 'Nuevo Usuario';
      document.getElementById('form-usuario').reset();
      document.getElementById('usuario-id').value = '';
      document.getElementById('modal-usuario').classList.remove('hidden');
    });

    document.getElementById('form-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('usuario-id').value;
      const data = {
        username: document.getElementById('usuario-username').value,
        nombre: document.getElementById('usuario-nombre').value,
        rol: document.getElementById('usuario-rol').value,
        password: document.getElementById('usuario-password').value
      };

      try {
        await apiCall('/usuarios', 'POST', data);
        document.getElementById('modal-usuario').classList.add('hidden');
        loadUsuarios();
      } catch (error) {
        showError(error.message);
      }
    });

    document.getElementById('form-actualizacion').addEventListener('submit', async (e) => {
      e.preventDefault();
      const tarjetaId = document.getElementById('actualizacion-tarjeta-id').value;
      const actualizacion = document.getElementById('actualizacion-texto').value;

      try {
        await apiCall(`/tarjetas/${tarjetaId}/historial`, 'POST', { actualizacion });
        document.getElementById('modal-actualizacion').classList.add('hidden');
        document.getElementById('form-actualizacion').reset();
        showHistorialDetalle(tarjetaId);
      } catch (error) {
        showError(error.message);
      }
    });

    document.getElementById('cambiar-password-btn').addEventListener('click', () => {
      document.getElementById('form-password').reset();
      document.getElementById('modal-password').classList.remove('hidden');
    });

    document.getElementById('form-password').addEventListener('submit', async (e) => {
      e.preventDefault();
      const passwordActual = document.getElementById('password-actual').value;
      const passwordNuevo = document.getElementById('password-nuevo').value;
      const passwordConfirm = document.getElementById('password-confirm').value;

      if (passwordNuevo !== passwordConfirm) {
        showError('Las contraseñas nuevas no coinciden');
        return;
      }

      if (passwordNuevo.length < 4) {
        showError('La contraseña debe tener al menos 4 caracteres');
        return;
      }

      try {
        await apiCall('/cambiar-password', 'PUT', { passwordActual, passwordNuevo });
        alert('Contraseña cambiada correctamente');
        document.getElementById('modal-password').classList.add('hidden');
      } catch (error) {
        showError(error.message);
      }
    });
  }

  function setupFilters() {
    const buscarInput = document.getElementById('buscar-tarjeta');
    const filtroEstatus = document.getElementById('filtro-estatus');
    const filtroUbicacion = document.getElementById('filtro-ubicacion');

    buscarInput.addEventListener('input', debounce(loadTarjetas, 300));
    filtroEstatus.addEventListener('change', loadTarjetas);
    filtroUbicacion.addEventListener('change', loadTarjetas);

    const buscarHistorial = document.getElementById('buscar-historial');
    buscarHistorial.addEventListener('input', debounce(buscarHistorialFn, 300));
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function loadTarjetas() {
    try {
      const buscar = document.getElementById('buscar-tarjeta').value;
      const estatus = document.getElementById('filtro-estatus').value;
      const ubicacion = document.getElementById('filtro-ubicacion').value;

      let tarjetas = await apiCall('/tarjetas');

      if (buscar) {
        tarjetas = tarjetas.filter(t =>
          t.serial.toLowerCase().includes(buscar.toLowerCase()) ||
          t.empresa.toLowerCase().includes(buscar.toLowerCase())
        );
      }
      if (estatus) tarjetas = tarjetas.filter(t => t.estatus === estatus);
      if (ubicacion) tarjetas = tarjetas.filter(t => t.ubicacion === ubicacion);

      renderTarjetas(tarjetas);
    } catch (error) {
      showError(error.message);
    }
  }

  function renderTarjetas(tarjetas) {
    const tbody = document.getElementById('tarjetas-tbody');

    if (tarjetas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            <p>No hay tarjetas registradas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tarjetas.map(t => `
      <tr>
        <td><span class="badge badge-modelo">${t.modelo}</span></td>
        <td><strong>${t.serial}</strong></td>
        <td>${t.s1 || '-'}</td>
        <td>${t.s2 || '-'}</td>
        <td>${t.descripcion || '-'}</td>
        <td><span class="badge badge-ubicacion">${t.ubicacion}</span></td>
        <td><span class="badge ${getBadgeClass(t.estatus)}">${t.estatus}</span></td>
        <td>${t.empresa}</td>
        <td>${formatDate(t.created_at)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="editTarjeta(${t.id})" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon" onclick="verHistorial(${t.id})" title="Ver Historial">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            ${currentUser && currentUser.rol === 'admin' ? `
            <button class="btn-icon danger" onclick="deleteTarjeta(${t.id})" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editTarjeta = async function(id) {
    try {
      const tarjeta = await apiCall(`/tarjetas/${id}`);
      document.getElementById('modal-tarjeta-titulo').textContent = 'Editar Tarjeta';
      document.getElementById('tarjeta-id').value = tarjeta.id;
      document.getElementById('tarjeta-modelo').value = tarjeta.modelo;
      document.getElementById('tarjeta-serial').value = tarjeta.serial;
      document.getElementById('tarjeta-s1').value = tarjeta.s1 || '';
      document.getElementById('tarjeta-s2').value = tarjeta.s2 || '';
      document.getElementById('tarjeta-descripcion').value = tarjeta.descripcion || '';
      document.getElementById('tarjeta-ubicacion').value = tarjeta.ubicacion;
      document.getElementById('tarjeta-estatus').value = tarjeta.estatus;
      document.getElementById('tarjeta-empresa').value = tarjeta.empresa;
      document.getElementById('modal-tarjeta').classList.remove('hidden');
    } catch (error) {
      showError(error.message);
    }
  };

  window.verHistorial = function(id) {
    showHistorialDetalle(id);
  };

  window.deleteTarjeta = async function(id) {
    if (confirm('¿Estás seguro de eliminar esta tarjeta?')) {
      try {
        await apiCall(`/tarjetas/${id}`, 'DELETE');
        loadTarjetas();
      } catch (error) {
        showError(error.message);
      }
    }
  };

  async function showHistorialDetalle(id) {
    try {
      const tarjeta = await apiCall(`/tarjetas/${id}`);
      const content = document.getElementById('historial-detail-content');

      content.innerHTML = `
        <div style="padding: 20px;">
          <div class="print-info" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Modelo</div>
              <div style="font-weight: 600;">${tarjeta.modelo}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Serial</div>
              <div style="font-weight: 600;">${tarjeta.serial}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Empresa</div>
              <div style="font-weight: 600;">${tarjeta.empresa}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Ubicación</div>
              <div style="font-weight: 600;">${tarjeta.ubicacion}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Estatus</div>
              <div><span class="badge ${getBadgeClass(tarjeta.estatus)}">${tarjeta.estatus}</span></div>
            </div>
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Descripción</div>
              <div>${tarjeta.descripcion || '-'}</div>
            </div>
          </div>

          <h4 style="margin-bottom: 16px; font-size: 14px; color: #1e293b;">Historial de Actualizaciones</h4>

          ${tarjeta.historial && tarjeta.historial.length > 0 ? `
            <div class="historial-timeline">
              ${tarjeta.historial.map(h => `
                <div class="historial-item">
                  <div class="historial-fecha">${formatDate(h.fecha)}</div>
                  <div class="historial-texto">${h.actualizacion}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: #64748b; font-style: italic;">No hay actualizaciones registradas</p>
          `}

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <button class="btn btn-primary" onclick="abrirActualizacion(${tarjeta.id})">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 4v16m8-8H4"/>
              </svg>
              Añadir Actualización
            </button>
            <button class="btn btn-secondary" onclick="imprimirHistorial(${tarjeta.id})" style="margin-left: 8px;">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Imprimir
            </button>
          </div>
        </div>
      `;

      document.getElementById('modal-historial').classList.remove('hidden');
    } catch (error) {
      showError(error.message);
    }
  };

  window.abrirActualizacion = function(tarjetaId) {
    document.getElementById('actualizacion-tarjeta-id').value = tarjetaId;
    document.getElementById('actualizacion-texto').value = '';
    document.getElementById('modal-actualizacion').classList.remove('hidden');
  };

  window.imprimirHistorial = async function(id) {
    try {
      const tarjeta = await apiCall(`/tarjetas/${id}`);

      const printArea = document.getElementById('print-area');
      printArea.innerHTML = `
        <div class="print-historial">
          <div class="print-info-row">
            <div class="print-info-left">
              <span class="print-info-label">Serial</span>
              <span class="print-info-value">${tarjeta.serial}</span>
            </div>
            <div class="print-info-center">
              <img src="/assets/LogoPrint.png" alt="Logo" style="max-width: 100px; max-height: 45px;">
            </div>
            <div class="print-info-right">
              <span class="print-info-label">Empresa</span>
              <span class="print-info-value">${tarjeta.empresa}</span>
            </div>
          </div>

          <h3 style="margin: 25px 0 15px 0; font-size: 14px; color: #1e293b; font-weight: 600;">Historial de Actualizaciones</h3>

          <div class="print-timeline">
            ${tarjeta.historial && tarjeta.historial.length > 0 ? tarjeta.historial.map(h => `
              <div class="print-item">
                <div class="print-fecha">${formatDate(h.fecha)}</div>
                <div class="print-texto">${h.actualizacion}</div>
              </div>
            `).join('') : '<p style="color: #64748b; font-style: italic;">No hay actualizaciones registradas</p>'}
          </div>
        </div>
      `;

      window.print();
    } catch (error) {
      showError(error.message);
    }
  };

  async function buscarHistorialFn() {
    const query = document.getElementById('buscar-historial').value;
    const resultados = document.getElementById('historial-resultados');

    if (!query) {
      resultados.innerHTML = '';
      return;
    }

    try {
      const tarjetas = await apiCall(`/tarjetas/buscar/${encodeURIComponent(query)}`);

      if (tarjetas.length === 0) {
        resultados.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <p>No se encontraron resultados</p>
          </div>
        `;
        return;
      }

      resultados.innerHTML = tarjetas.map(t => `
        <div class="historial-card">
          <div class="historial-card-header">
            <div class="historial-card-info">
              <h3>${t.serial}</h3>
              <p>${t.empresa} - ${t.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="historial-card-badges">
              <span class="badge badge-modelo">${t.modelo}</span>
              <span class="badge ${getBadgeClass(t.estatus)}">${t.estatus}</span>
              <span class="badge badge-ubicacion">${t.ubicacion}</span>
            </div>
          </div>
          <div class="historial-card-body">
            ${t.historial && t.historial.length > 0 ? `
              <div class="historial-timeline">
                ${t.historial.slice(-5).map(h => `
                  <div class="historial-item">
                    <div class="historial-fecha">${formatDate(h.fecha)}</div>
                    <div class="historial-texto">${h.actualizacion}</div>
                  </div>
                `).join('')}
                ${t.historial.length > 5 ? `<p style="color: #64748b; font-size: 12px;">... y ${t.historial.length - 5} anteriores</p>` : ''}
              </div>
            ` : `
              <p style="color: #64748b; font-style: italic;">No hay actualizaciones registradas</p>
            `}
          </div>
          <div class="historial-card-actions">
            <button class="btn btn-sm btn-primary" onclick="verHistorial(${t.id})">Ver Detalle Completo</button>
            <button class="btn btn-sm btn-secondary" onclick="imprimirHistorial(${t.id})">Imprimir</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadEstadisticas() {
    try {
      const stats = await apiCall('/estadisticas');

      document.getElementById('stat-total').textContent = stats.total;

      const statsEstatus = document.getElementById('stats-estatus');
      statsEstatus.innerHTML = stats.porEstatus.map(e => `
        <div class="stat-item">
          <span class="stat-item-label">${e.estatus}</span>
          <span class="stat-item-value">${e.count}</span>
        </div>
      `).join('');

      const statsUbicacion = document.getElementById('stats-ubicacion');
      statsUbicacion.innerHTML = stats.porUbicacion.map(u => `
        <div class="stat-item">
          <span class="stat-item-label">${u.ubicacion}</span>
          <span class="stat-item-value">${u.count}</span>
        </div>
      `).join('');

      const statsModelo = document.getElementById('stats-modelo');
      statsModelo.innerHTML = stats.porModelo.map(m => `
        <div class="stat-item">
          <span class="stat-item-label">${m.modelo}</span>
          <span class="stat-item-value">${m.count}</span>
        </div>
      `).join('');
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadUsuarios() {
    try {
      const usuarios = await apiCall('/usuarios');
      const tbody = document.getElementById('usuarios-tbody');

      if (usuarios.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">
              <p>No hay usuarios registrados</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = usuarios.map(u => `
        <tr>
          <td>${u.id}</td>
          <td><strong>${u.username}</strong></td>
          <td>${u.nombre}</td>
          <td><span class="badge ${u.rol === 'superadmin' ? 'badge-modelo' : 'badge-ubicacion'}">${u.rol}</span></td>
          <td>${formatDate(u.created_at)}</td>
          <td>
            <div class="action-buttons">
              ${u.id !== currentUser.id ? `
                <button class="btn-icon danger" onclick="deleteUsuario(${u.id})" title="Eliminar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      showError(error.message);
    }
  }

  window.deleteUsuario = async function(id) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await apiCall(`/usuarios/${id}`, 'DELETE');
        loadUsuarios();
      } catch (error) {
        showError(error.message);
      }
    }
  };

  async function loadLogs() {
    try {
      const logs = await apiCall('/logs');
      const tbody = document.getElementById('logs-tbody');

      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <p>No hay registros de actividad</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = logs.map(l => `
        <tr>
          <td>${formatDate(l.fecha)}</td>
          <td>${l.username || 'Sistema'}</td>
          <td>${l.accion}</td>
          <td>${l.details || '-'}</td>
        </tr>
      `).join('');
    } catch (error) {
      showError(error.message);
    }
  }
});

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    passwordInput.type = 'password';
    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}