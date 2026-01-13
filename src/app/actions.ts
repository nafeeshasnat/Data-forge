'use client';

import { generateSyntheticData } from '@/lib/data-generator';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';
import { defaultGenerationParams } from '@/lib/config';
import type { GenerationParams, GenerationResult, Student } from '@/lib/types';

export async function generateDataAction(params: GenerationParams): Promise<GenerationResult> {
  const generatedStudents = generateSyntheticData(params);
  const engine = new AnalysisEngine(generatedStudents, params);
  const { data, summary, insights } = engine.run();
  return { data, summary, insights, params };
}

export async function processUploadedData(data: Student[], params: GenerationParams = defaultGenerationParams): Promise<GenerationResult> {
  const engine = new AnalysisEngine(data, params);
  const { data: analyzed, summary, insights } = engine.run();
  return { data: analyzed, summary, insights, params };
}
