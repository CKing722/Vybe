const http = require('http');
const { createApp } = require('./app');
const { env } = require('./config/env');
const { closeDatabase } = require('./config/db');
const { configureSockets } = require('./sockets');

const app = createApp();
const server = http.createServer(app);
configureSockets(server, app);

server.listen(env.port, () => {
  console.log(`VYBE backend listening on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down VYBE backend`);
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
