import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import multer from 'multer';

const app = express();
const port = 3000;
const pythonCommand = '/usr/bin/python3';

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
// --- End Multer Setup ---

// API endpoint for merge and analyze
app.post('/api/merge', upload.array('files'), (req, res) => {
    console.log("[API /api/merge] Received request to merge files.");

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        console.log("[API /api/merge] No files were uploaded.");
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const plotPoints = req.body.plotPoints || 10;

    const filePaths = files.map(file => file.path);
    console.log(`[API /api/merge] Received ${files.length} files to process at paths: ${filePaths.join(', ')}`);

    const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'merge_and_analyze.py');
    console.log(`[API /api/merge] Executing python script at: ${scriptPath}`);

    const pythonArgs = [...filePaths, `--plot-points=${plotPoints}`];

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
        res.download(filePath, (err) => {
            if (err) {
                console.error(`[API /api/download] Error sending file:`, err);
                res.status(500).send({ error: 'Could not download the file.' });
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


// API endpoint for JSON to text conversion
app.post('/api/json-to-text', upload.single('file'), (req, res) => {
    console.log("[API /api/json-to-text] Received request for JSON to text conversion.");

    const file = req.file;
    if (!file) {
        console.log("[API /api/json-to-text] No file was uploaded.");
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = file.path;
    console.log(`[API /api/json-to-text] Received file to process at path: ${filePath}`);

    const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'json_to_text.py');
    console.log(`[API /api/json-to-text] Executing python script at: ${scriptPath}`);

    const pythonProcess = spawn(pythonCommand, [scriptPath, filePath]);

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
        console.log(`[API /api/json-to-text] Python script finished with code ${code}`);
        fs.unlink(filePath, err => {
            if (err) console.error(`[API /api/json-to-text] Failed to cleanup file ${filePath}:`, err);
        });

        if (code !== 0) {
            console.error(`[API /api/json-to-text] Python script failed with code ${code}.`);
            console.error(`[API /api/json-to-text] stderr: ${stderr}`);
            console.error(`[API /api/json-to-text] stdout: ${stdout}`);
            return res.status(500).json({
                error: 'Script execution failed',
                details: {
                    exitCode: code,
                    stderr: stderr,
                    stdout: stdout,
                }
            });
        }

        console.log("[API /api/json-to-text] JSON to text conversion successful, sending response.");
        res.send(stdout);
    });

    pythonProcess.on('error', (error) => {
        console.error(`[API /api/json-to-text] Failed to start python process: ${error.message}`);
        res.status(500).json({
            error: 'Failed to start conversion process',
            details: error.message
        });
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
