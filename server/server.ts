import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import multer from 'multer';

const app = express();
const port = 3000;
const pythonCommand = (() => {
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
console.log(`[Server] Using python at: ${pythonCommand}`);

const MAX_TMP_FILE_AGE_MS = 1000 * 60 * 60 * 6; // 6 hours
const activeMergedDownloads = new Set<string>();

const cleanupOldFiles = (dirPath: string, maxAgeMs: number) => {
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

const cleanupMergedFiles = (excludeFilenames: Set<string>) => {
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

// --- Multer Setup ---
const tmpDir = path.resolve(__dirname, '..', 'tmp');
const uploadDir = path.join(tmpDir, 'uploads');

try {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[Server] Temporary directory created at: ${tmpDir}`);
  }
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Server] Upload directory created at: ${uploadDir}`);
  }
} catch (error) {
  console.error(`[Server] Fatal error: Could not create temporary directories. Please check permissions.`, error);
  process.exit(1);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`[Multer] Destination requested for file: ${file.originalname}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log(`[Multer] Filename requested for file: ${file.originalname}`);
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
const trimUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tmpDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  })
});
// --- End Multer Setup ---

// API endpoint for merge and analyze
app.post('/api/merge', upload.array('files'), (req, res) => {
    console.log("[API /api/merge] Received request to merge files.");
    cleanupOldFiles(uploadDir, MAX_TMP_FILE_AGE_MS);
    cleanupOldFiles(tmpDir, MAX_TMP_FILE_AGE_MS);
    cleanupMergedFiles(activeMergedDownloads);

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        console.log("[API /api/merge] No files were uploaded.");
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const plotPoints = req.body.plotPoints || 10;
    const perfHigh = req.body.perfHigh ?? 3.5;
    const perfMid = req.body.perfMid ?? 2.0;
    console.log(`[API /api/merge] plotPoints: ${plotPoints}`);

    const filePaths = files.map(file => file.path);
    console.log(`[API /api/merge] Received ${files.length} files to process at paths: ${filePaths.join(', ')}`);
    files.forEach((file) => {
        console.log(`[API /api/merge] File: ${file.originalname} (${file.size} bytes) -> ${file.path}`);
    });

    const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'merge_and_analyze.py');
    console.log(`[API /api/merge] Executing python script at: ${scriptPath}`);

    const pythonArgs = [
        ...filePaths,
        `--plot-points=${plotPoints}`,
        `--perf-high=${perfHigh}`,
        `--perf-mid=${perfMid}`,
    ];

    const pythonProcess = spawn(pythonCommand, [scriptPath, ...pythonArgs]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] stdout: ${data}`);
        stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python] stderr: ${data}`);
        stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
        console.log(`[API /api/merge] Python script finished with code ${code}`);
        console.log(`[API /api/merge] stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
        filePaths.forEach(filePath => fs.unlink(filePath, err => {
            if (err) console.error(`[API /api/merge] Failed to cleanup file ${filePath}:`, err);
        }));

        if (code !== 0) {
            console.error(`[API /api/merge] Stderr: ${stderr}`);
            return res.status(500).send(stderr); // Send HTML error page directly
        }

        try {
            const result = JSON.parse(stdout);
            // Add the download path to the response
            result.downloadPath = `/api/download/${result.downloadFilename}`;
            console.log("[API /api/merge] Merge and analysis successful, sending response.");
            res.json(result);
        } catch (parseError) {
            console.error("[API /api/merge] Failed to parse python script output:", parseError);
            console.error("[API /api/merge] Raw stdout:", stdout);
            res.status(500).json({ error: 'Failed to parse script output', details: stdout });
        }
    });

    pythonProcess.on('error', (error) => {
        console.error("[API /api/merge] Failed to start python process:", error);
        res.status(500).json({ error: 'Failed to start analysis process'});
    });
});

// API endpoint for downloading merged files
app.get('/api/download/:filename', (req, res) => {
    const { filename } = req.params;
    console.log(`[API /api/download] Received request to download file: ${filename}`);
    const filePath = path.join(tmpDir, filename);

    if (fs.existsSync(filePath)) {
        console.log(`[API /api/download] File found. Sending file: ${filePath}`);
        if (filename.startsWith('merged_data_')) {
            activeMergedDownloads.add(filename);
        }
        res.download(filePath, (err) => {
            if (filename.startsWith('merged_data_')) {
                activeMergedDownloads.delete(filename);
            }
            if (err) {
                console.error(`[API /api/download] Error sending file:`, err);
                res.status(500).send({ error: 'Could not download the file.' });
                return;
            }
            // Clean up the file after download is complete
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`[API /api/download] Failed to cleanup file ${filePath}:`, unlinkErr);
                }
            });
        });
    } else {
        console.log(`[API /api/download] File not found: ${filePath}`);
        res.status(404).send({ error: 'File not found.' });
    }
});


// API endpoint for uploading a file for trimming
app.post('/api/upload', trimUpload.single('file'), (req, res) => {
    console.log("[API /api/upload] Received request to upload file for trimming.");
    cleanupOldFiles(tmpDir, MAX_TMP_FILE_AGE_MS);

    const file = req.file;
    if (!file) {
        console.log("[API /api/upload] No file was uploaded.");
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log(`[API /api/upload] File uploaded: ${file.filename}`);
    res.json({ success: true, filename: file.filename });
});

// API endpoint for trimming and analyzing a dataset
app.post('/api/trim', express.json(), (req, res) => {
    console.log("[API /api/trim] Received request to trim dataset.");

    const { filename, minCgpa, maxCgpa, percentage, perfHigh, perfMid } = req.body || {};
    if (!filename) {
        return res.status(400).json({ success: false, error: 'No filename provided.' });
    }

    const filePath = path.join(tmpDir, filename);
    console.log(`[API /api/trim] File path: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Uploaded file not found.' });
    }

    const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'trim_and_analyze.py');
    console.log(`[API /api/trim] Executing python script at: ${scriptPath}`);
    const pythonArgs = [
        scriptPath,
        filePath,
        `--min-cgpa=${minCgpa ?? 0}`,
        `--max-cgpa=${maxCgpa ?? 4.0}`,
        `--percentage=${percentage ?? 0}`,
        `--perf-high=${perfHigh ?? 3.5}`,
        `--perf-mid=${perfMid ?? 2.0}`,
    ];
    console.log(`[API /api/trim] Args: ${pythonArgs.join(' ')}`);

    const pythonProcess = spawn(pythonCommand, pythonArgs);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
        console.log(`[API /api/trim] Python script finished with code ${code}`);
        console.log(`[API /api/trim] stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
        fs.unlink(filePath, (err) => {
            if (err) console.error(`[API /api/trim] Failed to cleanup file ${filePath}:`, err);
        });

        if (code !== 0) {
            console.error(`[API /api/trim] Python script failed with code ${code}.`);
            console.error(`[API /api/trim] stderr: ${stderr}`);
            return res.status(500).json({ success: false, error: stderr || 'Trim script failed.' });
        }

        try {
            const result = JSON.parse(stdout);
            res.json({ success: true, ...result });
        } catch (parseError) {
            console.error("[API /api/trim] Failed to parse python script output:", parseError);
            console.error("[API /api/trim] Raw stdout:", stdout);
            res.status(500).json({ success: false, error: 'Failed to parse script output', details: stdout });
        }
    });

    pythonProcess.on('error', (error) => {
        console.error("[API /api/trim] Failed to start python process:", error);
        res.status(500).json({ success: false, error: 'Failed to start analysis process' });
    });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// For any other request, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[Server] Server listening on port ${port}`);
});
