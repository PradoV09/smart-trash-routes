import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * API Endpoints for mock data
 */

// Load mock data files
const loadMockData = (filename: string) => {
  try {
    const filePath = join(import.meta.dirname, '../../public/api/admin', filename);
    const data = readFileSync(filePath, 'utf-8');
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

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
