
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const files = data.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePaths = await Promise.all(files.map(async (file) => {
    const filePath = path.join(tempDir, file.name);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }));

  const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'merge_and_analyze.py');
  const command = `python3 ${scriptPath} ${filePaths.join(' ')}`;

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      // Always clean up the temporary files
      filePaths.forEach(filePath => fs.unlinkSync(filePath));

      if (error) {
        console.error(`Script execution failed:`, error);
        // Try to parse stderr for a more specific error message
        try {
          const errorJson = JSON.parse(stderr);
          return resolve(NextResponse.json({ error: 'Script execution failed', details: errorJson }, { status: 500 }));
        } catch (e) {
          return resolve(NextResponse.json({ error: 'Script execution failed', details: stderr }, { status: 500 }));
        }
      }

      try {
        const result = JSON.parse(stdout);
        return resolve(NextResponse.json(result));
      } catch (e) {
        console.error(`Failed to parse script output:`, e);
        return resolve(NextResponse.json({ error: 'Failed to parse script output', details: stdout }, { status: 500 }));
      }
    });
  });
}
