import express from 'express';
import path from 'path';
import apiRouter from './routes/api';
import { PORT, PYTHON_COMMAND, TMP_DIR, UPLOAD_DIR } from './config';
import { ensureTmpDirs } from './utils/file-cleanup';

const app = express();

try {
  ensureTmpDirs(TMP_DIR, UPLOAD_DIR);
} catch (error) {
  console.error('[Server] Fatal error: Could not create temporary directories. Please check permissions.', error);
  process.exit(1);
}

console.log(`[Server] Using python at: ${PYTHON_COMMAND}`);
console.log(`[Server] Server configured on port ${PORT}`);

app.use('/api', apiRouter);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// For any other request, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

export default app;
