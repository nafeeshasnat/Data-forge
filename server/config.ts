import fs from 'fs';
import path from 'path';

export const PORT = Number(process.env.PORT ?? 3030);

export const MAX_TMP_FILE_AGE_MS = 1000 * 60 * 60 * 6; // 6 hours

export const TMP_DIR = path.resolve(__dirname, '..', 'tmp');
export const UPLOAD_DIR = path.join(TMP_DIR, 'uploads');

export const PYTHON_COMMAND = (() => {
  const configured = process.env.PYTHON_PATH;
  if (configured && fs.existsSync(configured)) {
    return configured;
  }
  const venvPython = path.resolve(__dirname, '..', '.venv', 'bin', 'python');
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return '/usr/bin/python3';
})();
