import { NextResponse } from 'next/server';
import { generateSyntheticData } from '@/lib/data-generator';
import { analyzeData } from '@/lib/analysis';
import type { GenerationParams } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const params: GenerationParams = await request.json();
    const syntheticData = generateSyntheticData(params);
    const { data, summary } = analyzeData(syntheticData);

    // For now, insights are not generated, so we return an empty string.
    const insights = ""; 

    return NextResponse.json({ data, summary, insights });
  } catch (error) {
    console.error("Error generating data:", error);
    return NextResponse.json({ error: "Failed to generate data" }, { status: 500 });
  }
}
