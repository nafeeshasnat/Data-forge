'use client';

import type { GenerationParams, Grade } from '@/lib/types';

export const SUBJECT_COUNT = 60;

export const defaultGradeScale: Record<Grade, number> = {
  "A+": 4.0,
  "A": 3.75,
  "A-": 3.5,
  "B+": 3.25,
  "B": 3.0,
  "B-": 2.75,
  "C+": 2.5,
  "C": 2.25,
  "D": 2.0,
  "F": 0.0,
};

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
  gradeScale: defaultGradeScale,
};

export const performanceThresholds = {
  high: 3.5,
  mid: 2.0,
};
