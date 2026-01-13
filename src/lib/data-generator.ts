import type { GenerationParams, Student, Semester, Grade, PerformanceGroup } from './types';
import { DEPARTMENTS, SUBJECTS } from './subjects';
import { SUBJECT_COUNT, defaultGradeScale } from '@/lib/config';

// Generation flow:
// 1) Choose performance group + pre-grad GPAs.
// 2) Build a subject pool and split into semesters.
// 3) For each semester, compute GPA, apply attendance + credit impacts, then assign letter grades.
// 4) Emit student records with semester data and metadata.

export type SingleStudentOptions = {
  performanceGroup: PerformanceGroup;
  semesterCount: number;
  averageCredits: number;
  attendanceImpact?: number;
  maxCreditImpact?: number;
};

// Generates a stable, incrementing ID to reduce collisions across batches.
function getNextGenerationId(): number {
  const key = 'studentDataGenerationId';
  let currentId = 101; // Start from 101 as a base
  try {
    const storedId = localStorage.getItem(key);
    if (storedId) {
      currentId = parseInt(storedId, 10);
    }
    localStorage.setItem(key, String(currentId + 1));
  } catch (error) {
    // In case localStorage is not available (e.g., SSR, privacy settings)
    console.warn("Could not access localStorage to track generation ID.");
    // We can return a random high number to reduce collision probability
    return Math.floor(Math.random() * 1000) + 101;
  }
  return currentId;
}

function generateSubjectPool(department: string): string[] {
  const baseSubjects = SUBJECTS[department];
  const subjectPool: string[] = [];
  for (let i = 0; i < SUBJECT_COUNT; i++) {
    subjectPool.push(`${baseSubjects[i % baseSubjects.length]}`);
  }
  return [...new Set(subjectPool)];
}

const DEFAULT_GRADE_SCALE_TUPLES: [Grade, number][] = [
  ["A+", 4.00], ["A", 3.75], ["A-", 3.50],
  ["B+", 3.25], ["B", 3.00], ["B-", 2.75],
  ["C+", 2.50], ["C", 2.25],
  ["D", 2.00], ["F", 0.00]
];

type Rng = {
  random: () => number;
};

const hashStringToSeed = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const createRng = (seed?: number | string): Rng => {
  if (seed === undefined || seed === null || seed === "") {
    return { random: Math.random };
  }
  const seedNumber = typeof seed === "number" ? seed : hashStringToSeed(seed);
  return { random: mulberry32(seedNumber) };
};

const getSeededGenerationId = (seed: number | string): number => {
  const seedNumber = typeof seed === "number" ? seed : hashStringToSeed(seed);
  const normalized = Math.abs(seedNumber) % 9000;
  return 101 + normalized;
};

// Helper functions
const uniform = (rng: Rng, min: number, max: number) => rng.random() * (max - min) + min;
const randint = (rng: Rng, min: number, max: number) => Math.floor(rng.random() * (max - min + 1)) + min;
const FAILING_CGPA_THRESHOLD = 2.1;

function shuffle<T>(rng: Rng, array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(rng.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const choice = <T>(rng: Rng, arr: T[]): T => arr[Math.floor(rng.random() * arr.length)];

const PERFORMANCE_BOUNDARIES: Record<PerformanceGroup, { ssc: [number, number], hsc: [number, number], uni: [number, number] }> = {
  High: { ssc: [3.6, 5.0], hsc: [3.6, 5.0], uni: [3.2, 4.0] },
  Mid: { ssc: [2.6, 4.2], hsc: [2.6, 4.2], uni: [2.5, 3.5] },
  Low: { ssc: [2.0, 3.6], hsc: [2.0, 3.6], uni: [2.0, 2.8] },
};

function selectPerformanceGroup(rng: Rng, params: GenerationParams): PerformanceGroup {
  const { highPerformanceChance, lowPerformanceChance } = params;
  const midPerformanceChance = 1 - highPerformanceChance - lowPerformanceChance;
  const rand = rng.random();
  if (rand < highPerformanceChance) return 'High';
  if (rand < highPerformanceChance + midPerformanceChance) return 'Mid';
  return 'Low';
}

function getExceptionalPerformanceGroup(rng: Rng, originalGroup: PerformanceGroup): PerformanceGroup {
  if (originalGroup === 'High') return 'Low';
  if (originalGroup === 'Low') return 'High';
  return rng.random() < 0.5 ? 'High' : 'Low';
}

function generateGpaInBounds(rng: Rng, group: PerformanceGroup, type: 'ssc' | 'hsc'): number {
  const [min, max] = PERFORMANCE_BOUNDARIES[group][type];
  return uniform(rng, min, max);
}

function gpaToGrade(gpa: number, gradeScaleTuples: [Grade, number][]): Grade {
  for (const [grade, value] of gradeScaleTuples) {
    if (gpa >= value) return grade;
  }
  return "F";
}

function gradeForTargetGpa(rng: Rng, targetGpa: number, gradeScaleTuples: [Grade, number][]): Grade {
  if (gradeScaleTuples.length === 0) return "F";
  if (targetGpa >= gradeScaleTuples[0][1]) return gradeScaleTuples[0][0];

  for (let i = 0; i < gradeScaleTuples.length - 1; i += 1) {
    const [upperGrade, upperValue] = gradeScaleTuples[i];
    const [lowerGrade, lowerValue] = gradeScaleTuples[i + 1];
    if (targetGpa >= lowerValue) {
      const span = upperValue - lowerValue;
      if (span <= 0) return upperGrade;
      const upperChance = (targetGpa - lowerValue) / span;
      return rng.random() < upperChance ? upperGrade : lowerGrade;
    }
  }

  return gradeScaleTuples[gradeScaleTuples.length - 1][0];
}

function creditImpact(credits: number, params: GenerationParams): number {
  const { stdCredit, maxCredit, maxCreditImpact } = params;
  if (credits <= stdCredit) {
    return 0;
  }
  const deviation = (credits - stdCredit) / (maxCredit - stdCredit);
  const impact = -Math.pow(deviation, 1.5) * maxCreditImpact / 2.0;
  return impact;
}

export function buildCreditPlan(
  rng: Rng,
  semesterCount: number,
  averageCredits: number,
  minCredit: number,
  maxCredit: number
): number[] {
  const totalCredits = Math.round(averageCredits * semesterCount);
  const plan: number[] = [];
  let remaining = totalCredits;
  for (let i = 0; i < semesterCount; i += 1) {
    const semestersLeft = semesterCount - i;
    const minForRemaining = (semestersLeft - 1) * minCredit;
    const maxForRemaining = (semestersLeft - 1) * maxCredit;
    const minAllowed = Math.max(minCredit, remaining - maxForRemaining);
    const maxAllowed = Math.min(maxCredit, remaining - minForRemaining);
    const nextCredits = semestersLeft === 1 ? remaining : randint(rng, minAllowed, maxAllowed);
    plan.push(nextCredits);
    remaining -= nextCredits;
  }
  return plan;
}

export function generateSyntheticData(params: GenerationParams): Student[] {
  const students: Student[] = [];
  const gradeScale = params.gradeScale ?? defaultGradeScale;
  const gradeScaleTuples = Object.entries(gradeScale)
    .map(([grade, value]) => [grade as Grade, value] as [Grade, number])
    .sort((a, b) => b[1] - a[1]);
  const normalizedGradeScaleTuples = gradeScaleTuples.length ? gradeScaleTuples : DEFAULT_GRADE_SCALE_TUPLES;
  const currentYear = new Date().getFullYear();
  const maxBirthYear = currentYear - 30;
  const minBirthYear = maxBirthYear - 12;
  const rng = createRng(params.seed);

  // Get the unique generation ID for this batch of students
  const generationId = params.seed !== undefined && params.seed !== null && params.seed !== ""
    ? getSeededGenerationId(params.seed)
    : getNextGenerationId();

  for (let i = 1; i <= params.numStudents; i++) {
    // The second part of the ID, unique within this dataset (1 to 5000)
    const studentInGenerationId = i;

    // Combine the generation ID and the student-specific ID
    const student_id = (generationId * 10000) + studentInGenerationId;

    const performanceGroup = selectPerformanceGroup(rng, params);
    const department = choice(rng, DEPARTMENTS);
    const ssc_gpa = parseFloat(generateGpaInBounds(rng, performanceGroup, 'ssc').toFixed(2));
    const hsc_gpa = parseFloat(generateGpaInBounds(rng, performanceGroup, 'hsc').toFixed(2));

    const preGradUniGpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0;

    const perfectChance = params.perfectScorerChance ?? 0.8;
    const isPerfectScorer = performanceGroup === 'High' && preGradUniGpa > 3.75 && rng.random() < perfectChance;
    const perfectScorerTargetGpa = isPerfectScorer && rng.random() < 0.8
      ? uniform(rng, 3.80, 3.99)
      : 4.0;
    const failChance = params.failChance ?? 0;
    const isFailingStudent = !isPerfectScorer && rng.random() < failChance;

    const fullSubjectPool = generateSubjectPool(department);
    const studentSubjectPool = shuffle(rng, [...fullSubjectPool]).slice(0, SUBJECT_COUNT);

    const semesters: Record<string, Semester> = {};
    let semesterId = 1;
    let subjectsToAssign = [...studentSubjectPool];
    const studentBaseAttendance = uniform(rng, 60, 98);
    let prevAccumulatedGpa = 0.0; // start with 0 accumulated GPA

    while (subjectsToAssign.length > 0) {
      const subjectCount = Math.min(
        Math.ceil(randint(rng, params.minCredit, params.maxCredit) / params.creditsPerSubject),
        subjectsToAssign.length
      );
      const actualCredits = subjectCount * params.creditsPerSubject;
      const semesterSubjects = subjectsToAssign.splice(0, subjectCount);

      // --- PreGrad decay and accumulated GPA impact ---
      const preGradDecay = params.preGradDecay ?? 0.9; // decay per semester
      const w_preGrad = Math.pow(preGradDecay, semesterId - 1);
      const w_accum = 1 - w_preGrad;

      let semesterGpa: number;
      const attendancePercentage = Math.round(
        Math.max(0, Math.min(100, studentBaseAttendance + uniform(rng, -2.5, 2.5)))
      );

      if (isPerfectScorer) {
        semesterGpa = perfectScorerTargetGpa;
      } else {
        // Base GPA influenced by pre-grad and previous semesters
        let baseGpa = preGradUniGpa * w_preGrad + prevAccumulatedGpa * w_accum;

        // Random noise per semester
        baseGpa += uniform(rng, -0.2, 0.2);

        if (params.transitionShock
          && performanceGroup !== 'High'
          && hsc_gpa >= params.transitionShock.hscMin
          && semesterId <= params.transitionShock.maxSemesters
        ) {
          baseGpa -= params.transitionShock.drop;
        }

        // Exceptional performance adjustment
        if (performanceGroup !== 'High' && rng.random() < params.exceptionPercentage) {
          const exceptionalSwing = 0.35;
          baseGpa += getExceptionalPerformanceGroup(rng, performanceGroup) === 'High' ? exceptionalSwing : -exceptionalSwing;
        }

        // High performer "perfect score push"
        if (performanceGroup === 'High') {
          const perfectScorePush = (preGradUniGpa / 4.0) * params.preGradScoreInfluence;
          baseGpa = baseGpa * (1 - perfectScorePush) + 4.0 * perfectScorePush;
        }

        // Credit and attendance impact (soften negative pulls near the top end)
        const impactScale = baseGpa >= 3.6 ? 0.6 : baseGpa >= 3.3 ? 0.8 : 1.0;
        semesterGpa = baseGpa + creditImpact(actualCredits, params) * impactScale;
        const attendanceImpact = (attendancePercentage - 82.5) / 17.5 * params.attendanceImpact * impactScale;
        semesterGpa += attendanceImpact;
        if (!isFailingStudent && semesterGpa < FAILING_CGPA_THRESHOLD) {
          semesterGpa = FAILING_CGPA_THRESHOLD + uniform(rng, 0, 0.2);
        }

        // Clamp GPA
        semesterGpa = Math.max(0.0, Math.min(4.0, semesterGpa));
      }

      // Update accumulated GPA
      prevAccumulatedGpa = ((prevAccumulatedGpa * (semesterId - 1)) + semesterGpa) / semesterId;

      // --- Assign grades to subjects ---
      const semesterData: Semester = {
        creditHours: actualCredits,
        attendancePercentage: attendancePercentage
      };

      for (const subject of semesterSubjects) {
        let finalGpaForSubject = isPerfectScorer
          ? perfectScorerTargetGpa
          : Math.max(0, Math.min(4.0, semesterGpa + uniform(rng, -0.22, 0.22)));
        if (!isFailingStudent && !isPerfectScorer && finalGpaForSubject < FAILING_CGPA_THRESHOLD) {
          finalGpaForSubject = FAILING_CGPA_THRESHOLD + uniform(rng, 0, 0.2);
        }
        semesterData[subject] = isPerfectScorer
          ? gradeForTargetGpa(rng, finalGpaForSubject, normalizedGradeScaleTuples)
          : gpaToGrade(finalGpaForSubject, normalizedGradeScaleTuples);
      }

      semesters[String(semesterId)] = semesterData;
      semesterId++;
    }

    students.push({
      student_id: student_id,
      ssc_gpa: ssc_gpa,
      hsc_gpa: hsc_gpa,
      gender: choice(rng, ['male', 'female']),
      birth_year: randint(rng, minBirthYear, maxBirthYear),
      department: department,
      semesters: semesters,
    });
  }

  return students;
}

export function generateSingleStudent(
  params: GenerationParams,
  options: SingleStudentOptions
): { student: Student; semesterSummaries: Array<{ creditHours: number; attendancePercentage: number; gpa: number }> } {
  const rng = createRng(params.seed);
  const gradeScale = params.gradeScale ?? defaultGradeScale;
  const gradeScaleTuples = Object.entries(gradeScale)
    .map(([grade, value]) => [grade as Grade, value] as [Grade, number])
    .sort((a, b) => b[1] - a[1]);
  const normalizedGradeScaleTuples = gradeScaleTuples.length ? gradeScaleTuples : DEFAULT_GRADE_SCALE_TUPLES;
  const currentYear = new Date().getFullYear();
  const maxBirthYear = currentYear - 30;
  const minBirthYear = maxBirthYear - 12;

  const generationId = params.seed !== undefined && params.seed !== null && params.seed !== ""
    ? getSeededGenerationId(params.seed)
    : getNextGenerationId();
  const student_id = (generationId * 10000) + 1;
  const department = choice(rng, DEPARTMENTS);
  const ssc_gpa = parseFloat(generateGpaInBounds(rng, options.performanceGroup, 'ssc').toFixed(2));
  const hsc_gpa = parseFloat(generateGpaInBounds(rng, options.performanceGroup, 'hsc').toFixed(2));
  const preGradUniGpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0;
  const perfectChance = params.perfectScorerChance ?? 0.8;
  const isPerfectScorer = options.performanceGroup === 'High' && preGradUniGpa > 3.8 && rng.random() < perfectChance;
  const perfectScorerTargetGpa = isPerfectScorer && rng.random() < 0.5
    ? uniform(rng, 3.8, 3.9)
    : 4.0;
  const failChance = params.failChance ?? 0;
  const isFailingStudent = !isPerfectScorer && rng.random() < failChance;

  const fullSubjectPool = generateSubjectPool(department);
  const studentSubjectPool = shuffle(rng, [...fullSubjectPool]).slice(0, SUBJECT_COUNT);
  const creditPlan = buildCreditPlan(rng, options.semesterCount, options.averageCredits, params.minCredit, params.maxCredit);

  const semesters: Record<string, Semester> = {};
  const semesterSummaries: Array<{ creditHours: number; attendancePercentage: number; gpa: number }> = [];
  let subjectsToAssign = [...studentSubjectPool];
  const studentBaseAttendance = uniform(rng, 60, 98);
  let prevAccumulatedGpa = 0.0;

  for (let semesterIndex = 0; semesterIndex < creditPlan.length; semesterIndex += 1) {
    if (subjectsToAssign.length === 0) break;
    const requestedCredits = creditPlan[semesterIndex];
    const subjectCount = Math.min(
      Math.ceil(requestedCredits / params.creditsPerSubject),
      subjectsToAssign.length
    );
    const actualCredits = subjectCount * params.creditsPerSubject;
    const semesterSubjects = subjectsToAssign.splice(0, subjectCount);

    const semesterId = semesterIndex + 1;
    const preGradDecay = params.preGradDecay ?? 0.9;
    const w_preGrad = Math.pow(preGradDecay, semesterId - 1);
    const w_accum = 1 - w_preGrad;

    let semesterGpa: number;
    const attendancePercentage = Math.round(
      Math.max(0, Math.min(100, studentBaseAttendance + uniform(rng, -2.5, 2.5)))
    );

    if (isPerfectScorer) {
      semesterGpa = perfectScorerTargetGpa;
    } else {
      let baseGpa = preGradUniGpa * w_preGrad + prevAccumulatedGpa * w_accum;
      baseGpa += uniform(rng, -0.2, 0.2);

      if (params.transitionShock
        && options.performanceGroup !== 'High'
        && hsc_gpa >= params.transitionShock.hscMin
        && semesterId <= params.transitionShock.maxSemesters
      ) {
        baseGpa -= params.transitionShock.drop;
      }

      if (options.performanceGroup !== 'High' && rng.random() < params.exceptionPercentage) {
        const exceptionalSwing = 0.35;
        baseGpa += getExceptionalPerformanceGroup(rng, options.performanceGroup) === 'High' ? exceptionalSwing : -exceptionalSwing;
      }

      if (options.performanceGroup === 'High') {
        const perfectScorePush = (preGradUniGpa / 4.0) * params.preGradScoreInfluence;
        baseGpa = baseGpa * (1 - perfectScorePush) + 4.0 * perfectScorePush;
      }

      const effectiveParams: GenerationParams = {
        ...params,
        attendanceImpact: options.attendanceImpact ?? params.attendanceImpact,
        maxCreditImpact: options.maxCreditImpact ?? params.maxCreditImpact,
      };

      const impactScale = baseGpa >= 3.6 ? 0.6 : baseGpa >= 3.3 ? 0.8 : 1.0;
      semesterGpa = baseGpa + creditImpact(actualCredits, effectiveParams) * impactScale;
      const attendanceImpact = (attendancePercentage - 82.5) / 17.5 * effectiveParams.attendanceImpact * impactScale;
      semesterGpa += attendanceImpact;
      if (!isFailingStudent && semesterGpa < FAILING_CGPA_THRESHOLD) {
        semesterGpa = FAILING_CGPA_THRESHOLD + uniform(rng, 0, 0.2);
      }
      semesterGpa = Math.max(0.0, Math.min(4.0, semesterGpa));
    }

    prevAccumulatedGpa = ((prevAccumulatedGpa * semesterIndex) + semesterGpa) / semesterId;

    const semesterData: Semester = {
      creditHours: actualCredits,
      attendancePercentage: attendancePercentage,
    };

    for (const subject of semesterSubjects) {
      let finalGpaForSubject = isPerfectScorer
        ? perfectScorerTargetGpa
        : Math.max(0, Math.min(4.0, semesterGpa + uniform(rng, -0.22, 0.22)));
      if (!isFailingStudent && !isPerfectScorer && finalGpaForSubject < FAILING_CGPA_THRESHOLD) {
        finalGpaForSubject = FAILING_CGPA_THRESHOLD + uniform(rng, 0, 0.2);
      }
      semesterData[subject] = isPerfectScorer
        ? gradeForTargetGpa(rng, finalGpaForSubject, normalizedGradeScaleTuples)
        : gpaToGrade(finalGpaForSubject, normalizedGradeScaleTuples);
    }

    semesters[String(semesterId)] = semesterData;
    semesterSummaries.push({
      creditHours: actualCredits,
      attendancePercentage,
      gpa: Number(semesterGpa.toFixed(2)),
    });
  }

  return {
    student: {
      student_id,
      ssc_gpa,
      hsc_gpa,
      gender: choice(rng, ['male', 'female']),
      birth_year: randint(rng, minBirthYear, maxBirthYear),
      department,
      semesters,
    },
    semesterSummaries,
  };
}
