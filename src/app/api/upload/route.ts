
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded.' });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Store the uploaded file in the tmp directory with a unique name
  const tempDir = join(process.cwd(), 'tmp');
  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const path = join(tempDir, uniqueFilename);

  try {
    await writeFile(path, buffer);
    console.log(`File uploaded to ${path}`);
    // Return the unique filename to be used by the trim API
    return NextResponse.json({ success: true, filename: uniqueFilename });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file.' });
  }
}
