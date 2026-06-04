const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Load mock data files
const loadMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, 'public/api/admin', filename);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
};

// GET /api/admin/reportes
app.get('/api/admin/reportes', (req, res) => {
  const mockData = loadMockData('reportes.json');
  if (mockData) {
    res.json(mockData);
  } else {
    res.status(500).json({ success: false, message: 'Error loading reportes data' });
  }
});

// GET /api/admin/posiciones/activas
app.get('/api/admin/posiciones/activas', (req, res) => {
  const mockData = loadMockData('posiciones.json');
  if (mockData) {
    res.json(mockData);
  } else {
    res.status(404).json({ success: false, message: 'No posiciones data found' });
  }
});

// GET /api/admin/asignaciones
app.get('/api/admin/asignaciones', (req, res) => {
  const mockData = loadMockData('asignaciones.json');
  if (mockData) {
    res.json(mockData);
  } else {
    res.status(500).json({ success: false, message: 'Error loading asignaciones data' });
  }
});

// GET /api/admin/vehiculos
app.get('/api/admin/vehiculos', (req, res) => {
  const mockData = loadMockData('vehiculos.json');
  if (mockData) {
    res.json(mockData);
  } else {
    res.status(500).json({ success: false, message: 'Error loading vehiculos data' });
  }
});

// GET /api/admin/usuarios
app.get('/api/admin/usuarios', (req, res) => {
  const mockData = loadMockData('usuarios.json');
  if (mockData) {
    res.json(mockData);
  } else {
    res.status(500).json({ success: false, message: 'Error loading usuarios data' });
  }
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { identifier, contraseña } = req.body;
  if (identifier === 'admin@mail.com' && contraseña === '12345') {
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlciI6ImFkbWluQG1haWwuY29tIiwicm9sIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        token_type: 'bearer'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas.',
      data: null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
