const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Load mock data files
const loadMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, 'public', 'api', 'admin', filename);
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

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { identifier, contraseña } = req.body;
  
  // Mock login - accept any credentials for development
  // In production, this would validate against a database
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlciI6ImFkbWluQG1haWwuY29tIiwicm9sIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  res.json({
    success: true,
    message: 'Inicio de sesión exitoso.',
    data: {
      access_token: mockToken,
      token_type: 'bearer',
      usuario: {
        id_usuario: 1,
        username: identifier,
        rol: 'admin',
        perfil_id: '1'
      }
    }
  });
});

// Serve static files from dist/browser
const browserDistFolder = path.join(__dirname, 'dist', 'browser');
app.use(express.static(browserDistFolder));

// Handle SPA routing - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(browserDistFolder, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server listening on http://0.0.0.0:${PORT}`);
});
