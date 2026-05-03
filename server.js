const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jemcostock_secret_key_2024';

let db;
const isLocal = !process.env.TURSO_DATABASE_URL;

if (isLocal) {
  db = createClient({ url: 'file:jemcostock.db' });
} else {
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}

async function initTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuario',
      nombre TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tarjetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modelo TEXT NOT NULL,
      serial TEXT UNIQUE NOT NULL,
      s1 TEXT,
      s2 TEXT,
      descripcion TEXT,
      ubicacion TEXT NOT NULL,
      estatus TEXT NOT NULL,
      empresa TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarjeta_id INTEGER NOT NULL,
      actualizacion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (tarjeta_id) REFERENCES tarjetas(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      accion TEXT NOT NULL,
      details TEXT,
      fecha TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      logo TEXT
    )
  `);

  const usuarios = await db.execute('SELECT COUNT(*) as count FROM usuarios');
  if (usuarios.rows[0].count === 0) {
    const hashed1 = bcrypt.hashSync('admin1745', 10);
    const hashed2 = bcrypt.hashSync('amfo321', 10);
    const hashed3 = bcrypt.hashSync('Jemco1745', 10);

    await db.execute({
      sql: 'INSERT INTO usuarios (username, password, rol, nombre, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['admin', hashed1, 'admin', 'Administrador', new Date().toISOString()]
    });
    await db.execute({
      sql: 'INSERT INTO usuarios (username, password, rol, nombre, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['amfo97', hashed2, 'usuario', 'Angel Francia', new Date().toISOString()]
    });
    await db.execute({
      sql: 'INSERT INTO usuarios (username, password, rol, nombre, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['jemco97', hashed3, 'usuario', 'Jefri Calderin', new Date().toISOString()]
    });

    const tarjetasInit = [
      ['EPT045940', '1060C005C39', '53026', '2818', 'No da pantalla (AX18095)', 'Taller', 'Repuestos', 'RETOMC'],
      ['EPT017909', '10C60C011801', '213041', '0222', 'No modula', 'Entregada', 'Reparada', 'GD'],
      ['EPT045940', '10C60C00A241', '102024', '5219', 'No da imagen', 'Entregada', 'Reparada', 'THYMÚS'],
      ['EPT045940', '10C60C007A93', '067001', '0219', 'Falla alta tension', 'Entregada', 'Reparada', 'IMPROBELL'],
      ['EPT045940', '10C60C00644F', '56087', '4018', 'No Da imagen', 'Entregada', 'Reparada', 'No suministrado'],
      ['EPT017909', '10C60C00CB09', '', '', 'Falla sensor', 'Entregada', 'Reparada', 'BARY'],
      ['EPT017909', 'NT', '', '', 'FUNCIONA-JUMPER', 'Tecnoglass', 'Prestada', 'LUVAGA'],
      ['EPT045940', '10C60C009AFE', '092006', '4619', 'equipo no enciende', 'Entregada', 'Reparada', 'Berhlan Latebaida'],
      ['EPT045940', '10C60C009C7B', '103047', '5219', 'No puede generar vacio', 'Taller', 'Revision', 'Berhlan Latebaida'],
      ['EPT045940', '10C60C00AAB9', '092001', '4619', 'Error en la detección de carga', 'Taller', 'Reparada', 'Berhlan Latebaida'],
      ['EPT017909', '10CC60C0154BA', '4522', '032', 'FUNCIONAL 2', 'Angel', 'Prestada', 'LUVAGA'],
      ['EPT017909', '10C60C00C1B9', '', '', 'No gira Ventilador', 'Entregada', 'Reparada', 'Triada'],
      ['EPT045940', '10C60C0065F6', '4818', '063056', 'No da magen', 'Entregada', 'Reparada', 'BOMI'],
      ['EPT017909', '10C60C008EFE', '3419', '087032', 'Para Repuestos', 'Entregada', 'Reparada', 'REPUESTOS'],
      ['EPT017909', '10C60C0046CE', '0218', '043052', 'Para Repuestos 2', 'Taller', 'Testear', 'ECOSALSA'],
      ['EPT045940', '10C60C00BBE78', '2820', '124023', 'VENTILADOR', 'Entregada', 'Reparada', 'LLOREDA'],
      ['EPT045940', '10C60C00C714', '4220', '138034', 'NO TOUCH', 'Taller', 'Testear', 'COLANDES'],
      ['EPT017909', '10C60C0004BE', '3816', '006041', 'VALORES RAROS', 'Entregada', 'Funcional', 'No suministrado'],
      ['EPT017909', '10C60C0004BB', '3816', '006028', 'No Pantalla', 'Taller', 'Revision', 'No suministrado'],
      ['EPT017909', '10C60C0004B9', '3816', '006031', 'Perfil de chorro defectuoso', 'Entregada', 'Reparada', 'ECOLINE'],
      ['EPT045940', '10C60C008D09', '1419', '073035', 'Resolucion de pantalla erronea', 'Angel', 'Reparada', 'Berhlan'],
      ['EPT045940', '10C60C00FB5E', '3221', '189042', 'No frag gota', 'Entregada', 'Reparada', 'PROQUICOL'],
      ['EPT045940', '10C60C00A246', '5219', '102002', 'Prende apaga', 'Entregada', 'Reparada', 'Industrias masa'],
      ['EPT017909', '10C60C015CDD', '', '', 'Prende apaga', 'Taller', 'Revision', 'berhlan'],
      ['EPT017909', '10C60C00AAB8', '', '', 'No Fan', 'Entregada', 'Reparada', 'No suministrado'],
      ['EPT045940', '10C60C0137A2', '1622', '', 'no detecta ningun sensor', 'Angel', 'Reparada', 'Agroavicola san marino'],
      ['EPT045940', '10C60C0080A8', '1419', '073026', 'No detecta SD', 'Taller', 'Reparada', 'Berhlan'],
      ['EPT017909', '10C60C015CD3', '4522', '', 'Electro de carga', 'Taller', 'Reparada', 'Café'],
      ['EPT045940', '10C60C008D06', '1419', '74015', 'Pantalla en Blanco', 'Taller', 'Revision', 'No suministrado']
    ];

    const now = new Date().toISOString();
    for (const t of tarjetasInit) {
      await db.execute({
        sql: 'INSERT INTO tarjetas (modelo, serial, s1, s2, descripcion, ubicacion, estatus, empresa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [...t, now, now]
      });
    }

    await db.execute('INSERT INTO config (id, logo) VALUES (1, NULL)');
    console.log('Base de datos inicializada con 29 tarjetas');
  }
}

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el admin puede realizar esta acción' });
  }
  next();
}

async function logAction(usuarioId, accion, details) {
  await db.execute({
    sql: 'INSERT INTO logs (usuario_id, accion, details, fecha) VALUES (?, ?, ?, ?)',
    args: [usuarioId, accion, details, new Date().toISOString()]
  });
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM usuarios WHERE username = ?',
    args: [username]
  });

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const user = result.rows[0];

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, rol: user.rol, nombre: user.nombre }, JWT_SECRET, { expiresIn: '24h' });

  await logAction(user.id, 'LOGIN', 'Inicio de sesión');

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      rol: user.rol,
      nombre: user.nombre
    }
  });
});

app.put('/api/cambiar-password', authenticateToken, async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;

  if (!passwordActual || !passwordNuevo) {
    return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM usuarios WHERE id = ?',
    args: [req.user.id]
  });

  const user = result.rows[0];

  if (!bcrypt.compareSync(passwordActual, user.password)) {
    return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
  }

  const hashedPassword = bcrypt.hashSync(passwordNuevo, 10);

  await db.execute({
    sql: 'UPDATE usuarios SET password = ? WHERE id = ?',
    args: [hashedPassword, req.user.id]
  });

  await logAction(req.user.id, 'CAMBIAR_PASSWORD', 'Cambió su contraseña');
  res.json({ message: 'Contraseña actualizada correctamente' });
});

app.get('/api/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  const result = await db.execute('SELECT id, username, rol, nombre, created_at FROM usuarios');
  res.json(result.rows);
});

app.post('/api/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, rol, nombre } = req.body;

  if (!username || !password || !rol || !nombre) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (rol !== 'admin' && rol !== 'usuario') {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM usuarios WHERE username = ?',
    args: [username]
  });

  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  await db.execute({
    sql: 'INSERT INTO usuarios (username, password, rol, nombre, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [username, hashedPassword, rol, nombre, new Date().toISOString()]
  });

  await logAction(req.user.id, 'CREATE_USER', `Creó usuario: ${username}`);
  res.json({ message: 'Usuario creado correctamente' });
});

app.delete('/api/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }

  await db.execute({
    sql: 'DELETE FROM usuarios WHERE id = ?',
    args: [id]
  });

  await logAction(req.user.id, 'DELETE_USER', `Eliminó usuario ID: ${id}`);
  res.json({ message: 'Usuario eliminado' });
});

app.get('/api/tarjetas', authenticateToken, async (req, res) => {
  const tarjetasResult = await db.execute('SELECT * FROM tarjetas ORDER BY id DESC');
  const historialResult = await db.execute('SELECT * FROM historial');

  const historialMap = {};
  historialResult.rows.forEach(h => {
    if (!historialMap[h.tarjeta_id]) historialMap[h.tarjeta_id] = [];
    historialMap[h.tarjeta_id].push({ actualizacion: h.actualizacion, fecha: h.fecha });
  });

  const tarjetas = tarjetasResult.rows.map(t => ({
    ...t,
    historial: historialMap[t.id] || []
  }));

  res.json(tarjetas);
});

app.post('/api/tarjetas', authenticateToken, async (req, res) => {
  const { modelo, serial, descripcion, ubicacion, estatus, empresa } = req.body;

  if (!modelo || !serial || !ubicacion || !estatus || !empresa) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM tarjetas WHERE serial = ?',
    args: [serial]
  });

  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'El serial ya está registrado' });
  }

  const now = new Date().toISOString();

  const result = await db.execute({
    sql: 'INSERT INTO tarjetas (modelo, serial, s1, s2, descripcion, ubicacion, estatus, empresa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [modelo, serial, req.body.s1 || '', req.body.s2 || '', descripcion || '', ubicacion, estatus, empresa, now, now]
  });

  await logAction(req.user.id, 'CREATE_TARJETA', `Creó tarjeta Serial: ${serial}`);
  res.json({ message: 'Tarjeta registrada correctamente', id: result.lastInsertRowid });
});

app.put('/api/tarjetas/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { modelo, serial, s1, s2, descripcion, ubicacion, estatus, empresa } = req.body;

  await db.execute({
    sql: `UPDATE tarjetas SET modelo = ?, serial = ?, s1 = ?, s2 = ?, descripcion = ?, ubicacion = ?, estatus = ?, empresa = ?, updated_at = ? WHERE id = ?`,
    args: [modelo, serial, s1 || '', s2 || '', descripcion || '', ubicacion, estatus, empresa, new Date().toISOString(), id]
  });

  await logAction(req.user.id, 'UPDATE_TARJETA', `Actualizó tarjeta ID: ${id}`);
  res.json({ message: 'Tarjeta actualizada correctamente' });
});

app.delete('/api/tarjetas/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);

  await db.execute({ sql: 'DELETE FROM historial WHERE tarjeta_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM tarjetas WHERE id = ?', args: [id] });

  await logAction(req.user.id, 'DELETE_TARJETA', `Eliminó tarjeta ID: ${id}`);
  res.json({ message: 'Tarjeta eliminada correctamente' });
});

app.post('/api/tarjetas/:id/historial', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { actualizacion } = req.body;

  if (!actualizacion) {
    return res.status(400).json({ error: 'La actualización es requerida' });
  }

  const result = await db.execute({
    sql: 'INSERT INTO historial (tarjeta_id, actualizacion, fecha) VALUES (?, ?, ?)',
    args: [id, actualizacion, new Date().toISOString()]
  });

  await logAction(req.user.id, 'ADD_HISTORIAL', `Añadió historial a tarjeta ID: ${id}`);
  res.json({ message: 'Actualización añadida correctamente' });
});

app.get('/api/tarjetas/buscar/:query', authenticateToken, async (req, res) => {
  const query = req.params.query.toLowerCase();
  const result = await db.execute({
    sql: `SELECT * FROM tarjetas WHERE LOWER(serial) LIKE ? OR LOWER(empresa) LIKE ?`,
    args: [`%${query}%`, `%${query}%`]
  });

  const historialResult = await db.execute('SELECT * FROM historial');
  const historialMap = {};
  historialResult.rows.forEach(h => {
    if (!historialMap[h.tarjeta_id]) historialMap[h.tarjeta_id] = [];
    historialMap[h.tarjeta_id].push({ actualizacion: h.actualizacion, fecha: h.fecha });
  });

  res.json(result.rows.map(t => ({ ...t, historial: historialMap[t.id] || [] })));
});

app.get('/api/tarjetas/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await db.execute({
    sql: 'SELECT * FROM tarjetas WHERE id = ?',
    args: [id]
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Tarjeta no encontrada' });
  }

  const historialResult = await db.execute({
    sql: 'SELECT actualizacion, fecha FROM historial WHERE tarjeta_id = ?',
    args: [id]
  });

  res.json({ ...result.rows[0], historial: historialResult.rows });
});

app.get('/api/logs', authenticateToken, requireAdmin, async (req, res) => {
  const result = await db.execute('SELECT * FROM logs ORDER BY fecha DESC LIMIT 100');

  const usuariosResult = await db.execute('SELECT id, username FROM usuarios');
  const usuariosMap = {};
  usuariosResult.rows.forEach(u => usuariosMap[u.id] = u.username);

  res.json(result.rows.map(l => ({ ...l, username: usuariosMap[l.usuario_id] || 'Sistema' })));
});

app.get('/api/estadisticas', authenticateToken, async (req, res) => {
  const totalResult = await db.execute('SELECT COUNT(*) as total FROM tarjetas');
  const total = totalResult.rows[0].total;

  const estatusResult = await db.execute('SELECT estatus, COUNT(*) as count FROM tarjetas GROUP BY estatus');
  const ubicacionResult = await db.execute('SELECT ubicacion, COUNT(*) as count FROM tarjetas GROUP BY ubicacion');
  const modeloResult = await db.execute('SELECT modelo, COUNT(*) as count FROM tarjetas GROUP BY modelo');

  res.json({
    total,
    porEstatus: estatusResult.rows,
    porUbicacion: ubicacionResult.rows,
    porModelo: modeloResult.rows
  });
});

app.get('/api/config/logo', authenticateToken, async (req, res) => {
  const result = await db.execute('SELECT logo FROM config WHERE id = 1');
  res.json({ logo: result.rows[0]?.logo || null });
});

app.post('/api/config/logo', authenticateToken, requireAdmin, async (req, res) => {
  const { logo } = req.body;
  if (!logo) {
    return res.status(400).json({ error: 'Logo requerido' });
  }

  await db.execute({
    sql: 'UPDATE config SET logo = ? WHERE id = 1',
    args: [logo]
  });

  await logAction(req.user.id, 'UPDATE_LOGO', 'Cambió el logo');
  res.json({ message: 'Logo actualizado correctamente' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await initTables();
    app.listen(PORT, () => {
      console.log(`\n==========================================`);
      console.log(`  JemcoStock running on http://localhost:${PORT}`);
      console.log(`  Modo: ${isLocal ? 'Local (SQLite)' : 'Remoto (Turso)'}`);
      console.log(`  Login: admin / admin1745`);
      console.log(`  Login: amfo97 / amfo321`);
      console.log(`==========================================\n`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err);
    process.exit(1);
  }
}

startServer();