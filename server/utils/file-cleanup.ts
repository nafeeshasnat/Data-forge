import fs from 'fs';
import path from 'path';

export const ensureTmpDirs = (tmpDir: string, uploadDir: string) => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[Server] Temporary directory created at: ${tmpDir}`);
  }
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Server] Upload directory created at: ${uploadDir}`);
  }
};

export const cleanupOldFiles = (dirPath: string, maxAgeMs: number) => {
  try {
    if (!fs.existsSync(dirPath)) return;
    const now = Date.now();
    const entries = fs.readdirSync(dirPath);
    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry);
      try {
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) return;
        const ageMs = now - stats.mtimeMs;
        if (ageMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          console.log(`[Server] Cleaned old tmp file: ${fullPath}`);
        }
      } catch (error) {
        console.error(`[Server] Failed to inspect tmp file ${fullPath}:`, error);
      }
    });
  } catch (error) {
    console.error(`[Server] Failed to cleanup tmp dir ${dirPath}:`, error);
  }
};

export const cleanupMergedFiles = (tmpDir: string, excludeFilenames: Set<string>) => {
  try {
    if (!fs.existsSync(tmpDir)) return;
    const entries = fs.readdirSync(tmpDir);
    entries.forEach((entry) => {
      if (!entry.startsWith('merged_')) return;
      if (excludeFilenames.has(entry)) return;
      const fullPath = path.join(tmpDir, entry);
      try {
        fs.unlinkSync(fullPath);
        console.log(`[Server] Cleaned merged file: ${fullPath}`);
      } catch (error) {
        console.error(`[Server] Failed to delete merged file ${fullPath}:`, error);
      }
    });
  } catch (error) {
    console.error(`[Server] Failed to cleanup merged files in ${tmpDir}:`, error);
  }
};

export const cleanupTrimmedFiles = (tmpDir: string, excludeFilenames: Set<string>) => {
  try {
    if (!fs.existsSync(tmpDir)) return;
    const entries = fs.readdirSync(tmpDir);
    entries.forEach((entry) => {
      if (!entry.startsWith('trimmed_data_')) return;
      if (excludeFilenames.has(entry)) return;
      const fullPath = path.join(tmpDir, entry);
      try {
        fs.unlinkSync(fullPath);
        console.log(`[Server] Cleaned trimmed file: ${fullPath}`);
      } catch (error) {
        console.error(`[Server] Failed to delete trimmed file ${fullPath}:`, error);
      }
    });
  } catch (error) {
    console.error(`[Server] Failed to cleanup trimmed files in ${tmpDir}:`, error);
  }
};
