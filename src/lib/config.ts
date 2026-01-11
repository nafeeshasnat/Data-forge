'use client';

import type { GenerationParams } from '@/lib/types';

export const SUBJECT_COUNT = 60;

export const defaultGenerationParams: GenerationParams = {
  numStudents: 1000,
  creditsPerSubject: 3,
  minCredit: 9,
  stdCredit: 12,
  maxCredit: 22,
  maxCreditImpact: 0.05,
  highPerformanceChance: 0.2,
  lowPerformanceChance: 0.1,
  preGradScoreInfluence: 0.2,
  exceptionPercentage: 0.1,
  attendanceImpact: 0.4,
};

export const performanceThresholds = {
  high: 3.5,
  mid: 2.0,
};
