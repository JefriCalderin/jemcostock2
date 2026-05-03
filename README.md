# JemcoStock - Sistema de Gestión de Inventario

## Descripción
JemcoStock es un aplicativo web para gestionar el inventario de tarjetas, con módulos de autenticación, registro de tarjetas (Lugava), historial de actualizaciones e impresión en formato carta.

## Requisitos
- Python 3.x
- Flask
- PyJWT
- Flask-CORS

## Instalación
```bash
pip install flask flask-cors pyjwt
```

## Ejecución
```bash
python server.py
```

El aplicativo estará disponible en: **http://localhost:3000**


## Funcionalidades

### Módulo Lugava
- Registro de tarjetas con:
  - Modelo (EPT045940 o EPT017909)
  - Serial
  - Descripción
  - Ubicación (Taller, Angel, Entregada)
  - Estatus (Repuestos, Reparada, En revisión, Por Testear)
  - Empresa
- Listado con filtros por estatus y ubicación
- Búsqueda por serial o empresa
- Edición y eliminación de tarjetas

### Módulo Historial
- Búsqueda de tarjetas por serial o nombre de empresa
- Ver detalle completo del historial
- Añadir actualizaciones con fecha automática
- Impresión en formato carta (tamaño oficio/carta)

### Módulo Estadísticas
- Total de tarjetas
- Distribución por estatus
- Distribución por ubicación
- Distribución por modelo

### Administración (Solo Superadmin)
- Gestión de usuarios (crear, eliminar)
- Registro de actividad (logs)

## Estructura del Proyecto
```
jemcostock/
├── server.py          # Servidor Flask
├── jemcostock.db      # Base de datos SQLite
├── requirements.txt   # Dependencias Python
├── public/
│   ├── index.html    # Aplicación frontend
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
└── README.md
```

## Características
- ✅ Diseño responsive (escritorio y móvil)
- ✅ Sistema de autenticación seguro con JWT
- ✅ Base de datos SQLite (persistente)
- ✅ Escalable (estructura modular)
- ✅ Impresión optimizada para formato carta