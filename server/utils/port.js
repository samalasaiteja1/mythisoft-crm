import net from 'node:net';

export async function findAvailablePort(startPort = 5000, attempts = 20) {
  for (let port = startPort; port < startPort + attempts; port += 1) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }

  throw new Error(`No available port found from ${startPort} to ${startPort + attempts - 1}`);
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      resolve(error.code !== 'EADDRINUSE');
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}
