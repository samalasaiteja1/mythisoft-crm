import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import app from './app.js';
import { findAvailablePort } from './utils/port.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const requestedPort = Number.parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

const startServer = async () => {
  try {
    const port = await findAvailablePort(requestedPort);
    const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

    if (isProduction) {
      app.use(express.static(clientDistPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ message: 'API route not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }

    app.listen(port, () => console.log(`MYTHISOFT CRM Server running on port ${port}`));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
