
import { NextRequest, NextResponse } from 'next/server';
import { runTerminalCommand } from '@/lib/utils/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const { filename, minCgpa, maxCgpa, percentage } = await request.json();

  if (!filename) {
    return NextResponse.json({ success: false, error: 'No filename provided.' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'tmp', filename);

  // Construct the command to execute the Python script
  const command = `
    python3 src/scripts/trim_and_analyze.py "${filePath}" \
    --min-cgpa=${minCgpa} \
    --max-cgpa=${maxCgpa} \
    --percentage=${percentage}
  `;

  try {
    // Execute the command
    const output = await runTerminalCommand(command);
    
    // The Python script prints a JSON object to stdout
    const result = JSON.parse(output);

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error('Error executing trim script:', error);
    let errorMessage = 'Failed to execute trim script.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    try {
        // Try to parse the error message as JSON, as the script might output a JSON error object
        const errorJson = JSON.parse(errorMessage);
        return NextResponse.json({ success: false, ...errorJson }, { status: 500 });
    } catch (parseError) {
        // If parsing fails, return the original error message
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
  }
}
