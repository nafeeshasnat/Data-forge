import express from 'express';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import type { Express } from 'express';
import { MAX_TMP_FILE_AGE_MS, PYTHON_COMMAND, TMP_DIR, UPLOAD_DIR } from '../config';
import { cleanupMergedFiles, cleanupOldFiles, cleanupTrimmedFiles } from '../utils/file-cleanup';
import { analyzeSingleStudent, detectDatasetType } from '../utils/student-analysis';
import { createUploadMiddleware } from '../middleware/uploads';

const router = express.Router();
const { upload, trimUpload } = createUploadMiddleware(UPLOAD_DIR, TMP_DIR);

const activeMergedDownloads = new Set<string>();
const activeTrimmedDownloads = new Set<string>();

const runPythonScript = (scriptPath: string, args: string[]) => {
  const pythonProcess = spawn(PYTHON_COMMAND, [scriptPath, ...args]);

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python] stderr: ${data}`);
    stderr += data.toString();
  });

  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    pythonProcess.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
  });
};

const runMergeAndAnalyze = async (filePaths: string[], plotPoints: number, perfHigh: number, perfMid: number) => {
  const scriptPath = path.join(__dirname, '..', '..', 'src', 'scripts', 'merge_and_analyze.py');
  console.log(`[API] Executing python script at: ${scriptPath}`);

  const pythonArgs = [
    ...filePaths,
    `--plot-points=${plotPoints}`,
    `--perf-high=${perfHigh}`,
    `--perf-mid=${perfMid}`,
  ];

  return runPythonScript(scriptPath, pythonArgs);
};

const runTrimAndAnalyze = async (filePath: string, minCgpa: number, maxCgpa: number, percentage: number, perfHigh: number, perfMid: number) => {
  const scriptPath = path.join(__dirname, '..', '..', 'src', 'scripts', 'trim_and_analyze.py');
  console.log(`[API] Executing python script at: ${scriptPath}`);
  const pythonArgs = [
    filePath,
    `--min-cgpa=${minCgpa}`,
    `--max-cgpa=${maxCgpa}`,
    `--percentage=${percentage}`,
    `--perf-high=${perfHigh}`,
    `--perf-mid=${perfMid}`,
  ];

  return runPythonScript(scriptPath, pythonArgs);
};

const runGenerateData = async (payload: Record<string, unknown>) => {
  const scriptPath = path.join(__dirname, '..', '..', 'src', 'scripts', 'generate_data.py');
  console.log(`[API] Executing python script at: ${scriptPath}`);
  const pythonArgs = ['--payload', JSON.stringify(payload)];
  return runPythonScript(scriptPath, pythonArgs);
};

const cleanupAll = () => {
  cleanupOldFiles(UPLOAD_DIR, MAX_TMP_FILE_AGE_MS);
  cleanupOldFiles(TMP_DIR, MAX_TMP_FILE_AGE_MS);
  cleanupMergedFiles(TMP_DIR, activeMergedDownloads);
  cleanupTrimmedFiles(TMP_DIR, activeTrimmedDownloads);
};

// API endpoint for merge and analyze
router.post('/merge', upload.array('files'), async (req, res) => {
  console.log('[API /api/merge] Received request to merge files.');
  cleanupAll();

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    console.log('[API /api/merge] No files were uploaded.');
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const plotPoints = Number(req.body.plotPoints ?? 10);
  const perfHigh = Number(req.body.perfHigh ?? 3.5);
  const perfMid = Number(req.body.perfMid ?? 2.0);
  console.log(`[API /api/merge] plotPoints: ${plotPoints}`);

  const filePaths = files.map((file) => file.path);
  console.log(`[API /api/merge] Received ${files.length} files to process at paths: ${filePaths.join(', ')}`);
  files.forEach((file) => {
    console.log(`[API /api/merge] File: ${file.originalname} (${file.size} bytes) -> ${file.path}`);
  });

  try {
    const { code, stdout, stderr } = await runMergeAndAnalyze(filePaths, plotPoints, perfHigh, perfMid);
    console.log(`[API /api/merge] Python script finished with code ${code}`);
    console.log(`[API /api/merge] stdout length: ${stdout.length}, stderr length: ${stderr.length}`);

    filePaths.forEach((filePath) => fs.unlink(filePath, (err) => {
      if (err) console.error(`[API /api/merge] Failed to cleanup file ${filePath}:`, err);
    }));

    if (code !== 0) {
      console.error(`[API /api/merge] Stderr: ${stderr}`);
      return res.status(500).send(stderr);
    }

    try {
      const result = JSON.parse(stdout);
      result.downloadPath = `/api/download/${result.downloadFilename}`;
      console.log('[API /api/merge] Merge and analysis successful, sending response.');
      return res.json(result);
    } catch (parseError) {
      console.error('[API /api/merge] Failed to parse python script output:', parseError);
      console.error('[API /api/merge] Raw stdout (truncated):', stdout.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse script output', details: stdout });
    }
  } catch (error) {
    console.error('[API /api/merge] Failed to start python process:', error);
    return res.status(500).json({ error: 'Failed to start analysis process' });
  }
});

// API endpoint for analyzing a single dataset or student
router.post('/analyze', upload.single('file'), async (req, res) => {
  console.log('[API /api/analyze] Received request to analyze file.');
  cleanupAll();

  const file = req.file;
  if (!file) {
    console.log('[API /api/analyze] No file was uploaded.');
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const plotPoints = Number(req.body.plotPoints ?? 10);
  const perfHigh = Number(req.body.perfHigh ?? 3.5);
  const perfMid = Number(req.body.perfMid ?? 2.0);

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file.path, 'utf8'));
  } catch (error) {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ success: false, error: 'Invalid JSON file.' });
  }

  const datasetType = detectDatasetType(parsed);
  if (!datasetType) {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ success: false, error: 'Unsupported dataset format.' });
  }

  if (datasetType === 'single') {
    const analysis = analyzeSingleStudent(parsed as Record<string, any>);
    fs.unlink(file.path, () => {});
    return res.json({
      datasetType: 'single',
      student: {
        studentId: (parsed as Record<string, any>).student_id ?? (parsed as Record<string, any>).studentId ?? null,
        department: (parsed as Record<string, any>).department ?? null,
        gender: (parsed as Record<string, any>).gender ?? null,
        birthYear: (parsed as Record<string, any>).birth_year ?? (parsed as Record<string, any>).birthYear ?? null,
      },
      analysis,
    });
  }

  try {
    const { code, stdout, stderr } = await runMergeAndAnalyze([file.path], plotPoints, perfHigh, perfMid);
    console.log(`[API /api/analyze] Python script finished with code ${code}`);
    console.log(`[API /api/analyze] stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
    fs.unlink(file.path, () => {});

    if (code !== 0) {
      console.error(`[API /api/analyze] Stderr: ${stderr}`);
      return res.status(500).send(stderr);
    }

    try {
      const result = JSON.parse(stdout);
      result.datasetType = 'dataset';
      if (result.downloadFilename) {
        result.downloadPath = `/api/download/${result.downloadFilename}`;
      }
      console.log('[API /api/analyze] Analysis successful, sending response.');
      return res.json(result);
    } catch (parseError) {
      console.error('[API /api/analyze] Failed to parse python script output:', parseError);
      console.error('[API /api/analyze] Raw stdout (truncated):', stdout.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse script output', details: stdout });
    }
  } catch (error) {
    console.error('[API /api/analyze] Failed to start python process:', error);
    return res.status(500).json({ error: 'Failed to start analysis process' });
  }
});

// API endpoint for downloading merged files
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  console.log(`[API /api/download] Received request to download file: ${filename}`);
  const filePath = path.join(TMP_DIR, filename);

  if (fs.existsSync(filePath)) {
    console.log(`[API /api/download] File found. Sending file: ${filePath}`);
    if (filename.startsWith('merged_')) {
      activeMergedDownloads.add(filename);
    }
    if (filename.startsWith('trimmed_data_')) {
      activeTrimmedDownloads.add(filename);
    }
    res.download(filePath, (err) => {
      if (filename.startsWith('merged_')) {
        activeMergedDownloads.delete(filename);
      }
      if (filename.startsWith('trimmed_data_')) {
        activeTrimmedDownloads.delete(filename);
      }
      if (err) {
        console.error(`[API /api/download] Error sending file:`, err);
        res.status(500).send({ error: 'Could not download the file.' });
        return;
      }
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
router.post('/upload', trimUpload.single('file'), (req, res) => {
  console.log('[API /api/upload] Received request to upload file for trimming.');
  cleanupOldFiles(TMP_DIR, MAX_TMP_FILE_AGE_MS);
  cleanupTrimmedFiles(TMP_DIR, activeTrimmedDownloads);

  const file = req.file;
  if (!file) {
    console.log('[API /api/upload] No file was uploaded.');
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  console.log(`[API /api/upload] File uploaded: ${file.filename}`);
  res.json({ success: true, filename: file.filename });
});

// API endpoint for trimming and analyzing a dataset
router.post('/trim', express.json(), async (req, res) => {
  console.log('[API /api/trim] Received request to trim dataset.');
  cleanupTrimmedFiles(TMP_DIR, activeTrimmedDownloads);

  const { filename, minCgpa, maxCgpa, percentage, perfHigh, perfMid } = req.body || {};
  if (!filename) {
    return res.status(400).json({ success: false, error: 'No filename provided.' });
  }

  const filePath = path.join(TMP_DIR, filename);
  console.log(`[API /api/trim] File path: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Uploaded file not found.' });
  }

  try {
    const { code, stdout, stderr } = await runTrimAndAnalyze(
      filePath,
      Number(minCgpa ?? 0),
      Number(maxCgpa ?? 4.0),
      Number(percentage ?? 0),
      Number(perfHigh ?? 3.5),
      Number(perfMid ?? 2.0)
    );

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
      return res.json({ success: true, ...result });
    } catch (parseError) {
      console.error('[API /api/trim] Failed to parse python script output:', parseError);
      console.error('[API /api/trim] Raw stdout (truncated):', stdout.slice(0, 500));
      return res.status(500).json({ success: false, error: 'Failed to parse script output', details: stdout });
    }
  } catch (error) {
    console.error('[API /api/trim] Failed to start python process:', error);
    return res.status(500).json({ success: false, error: 'Failed to start analysis process' });
  }
});

// API endpoint for generating synthetic datasets
router.post('/generate', express.json(), async (req, res) => {
  console.log('[API /api/generate] Received request to generate dataset.');
  const params = req.body?.params ?? req.body;
  if (!params) {
    return res.status(400).json({ error: 'No generation parameters provided.' });
  }

  try {
    const { code, stdout, stderr } = await runGenerateData({ mode: 'dataset', params });
    console.log(`[API /api/generate] Python script finished with code ${code}`);

    if (code !== 0) {
      console.error(`[API /api/generate] Stderr: ${stderr}`);
      return res.status(500).send(stderr);
    }

    try {
      const result = JSON.parse(stdout);
      return res.json(result);
    } catch (parseError) {
      console.error('[API /api/generate] Failed to parse python script output:', parseError);
      console.error('[API /api/generate] Raw stdout (truncated):', stdout.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse script output', details: stdout });
    }
  } catch (error) {
    console.error('[API /api/generate] Failed to start python process:', error);
    return res.status(500).json({ error: 'Failed to start generation process' });
  }
});

// API endpoint for generating a single student dataset
router.post('/generate-single', express.json(), async (req, res) => {
  console.log('[API /api/generate-single] Received request to generate single student.');
  const params = req.body?.params;
  const options = req.body?.options;
  if (!params || !options) {
    return res.status(400).json({ error: 'Missing generation parameters or options.' });
  }

  try {
    const { code, stdout, stderr } = await runGenerateData({ mode: 'single', params, options });
    console.log(`[API /api/generate-single] Python script finished with code ${code}`);

    if (code !== 0) {
      console.error(`[API /api/generate-single] Stderr: ${stderr}`);
      return res.status(500).send(stderr);
    }

    try {
      const result = JSON.parse(stdout);
      return res.json(result);
    } catch (parseError) {
      console.error('[API /api/generate-single] Failed to parse python script output:', parseError);
      console.error('[API /api/generate-single] Raw stdout (truncated):', stdout.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse script output', details: stdout });
    }
  } catch (error) {
    console.error('[API /api/generate-single] Failed to start python process:', error);
    return res.status(500).json({ error: 'Failed to start generation process' });
  }
});

export default router;
