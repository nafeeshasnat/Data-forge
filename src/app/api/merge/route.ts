import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const files = data.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const filePaths: string[] = [];
  const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');

  try {
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(uploadDir, file.name);
      const bytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
      filePaths.push(filePath);
    }

    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'merge_and_analyze.py');
    const command = `python ${scriptPath} ${filePaths.join(' ')}`;

    const output = await new Promise<string>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return reject(stderr);
        }
        resolve(stdout);
      });
    });

    const result = JSON.parse(output);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process files' }, { status: 500 });
  } finally {
    // Clean up uploaded files
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error(`Failed to clean up file: ${filePath}`, cleanupError);
      }
    }
  }
}
