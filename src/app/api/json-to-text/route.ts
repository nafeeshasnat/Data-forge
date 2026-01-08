
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, file.name);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(filePath, buffer);

  const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'json_to_text.py');
  const command = `python3 ${scriptPath} ${filePath}`;

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      // Always clean up the temporary file
      fs.unlinkSync(filePath);

      if (error) {
        console.error(`Script execution failed:`, error);
        return resolve(NextResponse.json({ error: 'Script execution failed', details: stderr }, { status: 500 }));
      }
      
      // For this script, we expect the output to be plain text, so we don't parse it as JSON
      return resolve(new NextResponse(stdout, { status: 200, headers: { 'Content-Type': 'text/plain' } }));
    });
  });
}

