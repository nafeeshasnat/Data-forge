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
  preGradDecay: 0.9,
  preGradScoreInfluence: 0.2,
  exceptionPercentage: 0.1,
  attendanceImpact: 0.4,
  failChance: 0.1,
  perfectScorerChance: 0.8,
  gradeScale: defaultGradeScale,
  transitionShock: {
    hscMin: 4.2,
    maxSemesters: 3,
    drop: 0.55,
  },
};

export const performanceThresholds = {
  high: 3.5,
  mid: 2.0,
};

export const thesisBaselineProfiles: Record<string, GenerationParams> = {
  thesisBaseline: {
    numStudents: 5000,
    creditsPerSubject: 3,
    minCredit: 9,
    stdCredit: 15,
    maxCredit: 21,
    maxCreditImpact: 0.20,
    highPerformanceChance: 0.18,
    lowPerformanceChance: 0.12,
    preGradDecay: 0.75,
    preGradScoreInfluence: 0.10,
    exceptionPercentage: 0.30,
    attendanceImpact: 0.12,
    failChance: 0.1,
    perfectScorerChance: 0.8,
    gradeScale: defaultGradeScale,
    analysisPerformanceThresholds: performanceThresholds,
  },
  naturalDistribution: {
    numStudents: 5000,
    creditsPerSubject: 3,
    minCredit: 9,
    stdCredit: 15,
    maxCredit: 21,
    maxCreditImpact: 0.24,
    highPerformanceChance: 0.18,
    lowPerformanceChance: 0.12,
    preGradDecay: 0.75,
    preGradScoreInfluence: 0.10,
    exceptionPercentage: 0.25,
    attendanceImpact: 0.12,
    failChance: 0.1,
    perfectScorerChance: 0.8,
    gradeScale: defaultGradeScale,
    analysisPerformanceThresholds: performanceThresholds,
    seed: "thesis-natural-01",
  },
};

export const thesisBaselineParams: GenerationParams = thesisBaselineProfiles.thesisBaseline;
