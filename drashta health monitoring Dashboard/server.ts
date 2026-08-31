import { startServer } from './server/server.js';

const PORT = 3000;

startServer(PORT).catch((err) => {
  console.error('[DRASHTA Server] Fatal startup failure:', err);
  process.exit(1);
});
