import type { GenerationParams, Student, Semester, Grade, PerformanceGroup } from './types';
import { DEPARTMENTS, SUBJECTS } from './subjects';
import { SUBJECT_COUNT, defaultGradeScale } from '@/lib/config';

// Generation flow:
// 1) Choose performance group + pre-grad GPAs.
// 2) Build a subject pool and split into semesters.
// 3) For each semester, compute GPA, apply attendance + credit impacts, then assign letter grades.
// 4) Emit student records with semester data and metadata.

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

// Helper functions
const uniform = (min: number, max: number) => Math.random() * (max - min) + min;
const randint = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const choice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const PERFORMANCE_BOUNDARIES: Record<PerformanceGroup, { ssc: [number, number], hsc: [number, number], uni: [number, number] }> = {
    High: { ssc: [3.6, 5.0], hsc: [3.6, 5.0], uni: [3.2, 4.0] },
    Mid:  { ssc: [2.6, 4.2], hsc: [2.6, 4.2], uni: [2.6, 3.6] },
    Low:  { ssc: [2.0, 3.6], hsc: [2.0, 3.6], uni: [2.0, 3.2] },
};

function selectPerformanceGroup(params: GenerationParams): PerformanceGroup {
  const { highPerformanceChance, lowPerformanceChance } = params;
  const midPerformanceChance = 1 - highPerformanceChance - lowPerformanceChance;
  const rand = Math.random();
  if (rand < highPerformanceChance) return 'High';
  if (rand < highPerformanceChance + midPerformanceChance) return 'Mid';
  return 'Low';
}

function getExceptionalPerformanceGroup(originalGroup: PerformanceGroup): PerformanceGroup {
    if (originalGroup === 'High') return 'Low';
    if (originalGroup === 'Low') return 'High';
    return Math.random() < 0.5 ? 'High' : 'Low';
}

function generateGpaInBounds(group: PerformanceGroup, type: 'ssc' | 'hsc'): number {
  const [min, max] = PERFORMANCE_BOUNDARIES[group][type];
  return uniform(min, max);
}

function gpaToGrade(gpa: number, gradeScaleTuples: [Grade, number][]): Grade {
  for (const [grade, value] of gradeScaleTuples) {
    if (gpa >= value) return grade;
  }
  return "F";
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

  // Get the unique generation ID for this batch of students
  const generationId = getNextGenerationId();

  for (let i = 1; i <= params.numStudents; i++) {
    // The second part of the ID, unique within this dataset (1 to 5000)
    const studentInGenerationId = i;

    // Combine the generation ID and the student-specific ID
    const student_id = (generationId * 10000) + studentInGenerationId;

    const performanceGroup = selectPerformanceGroup(params);
    const department = choice(DEPARTMENTS);
    const ssc_gpa = parseFloat(generateGpaInBounds(performanceGroup, 'ssc').toFixed(2));
    const hsc_gpa = parseFloat(generateGpaInBounds(performanceGroup, 'hsc').toFixed(2));
    
    const preGradUniGpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0;

    const isPerfectScorer = performanceGroup === 'High' && preGradUniGpa > 3.8 && Math.random() < 0.8;
    
    const fullSubjectPool = generateSubjectPool(department);
    const studentSubjectPool = shuffle([...fullSubjectPool]).slice(0, SUBJECT_COUNT);

    const semesters: Record<string, Semester> = {};
    let semesterId = 1;
    let subjectsToAssign = [...studentSubjectPool];
    const studentBaseAttendance = uniform(60, 98);
    let prevAccumulatedGpa = 0.0; // start with 0 accumulated GPA

    while (subjectsToAssign.length > 0) {
      const subjectCount = Math.min(
        Math.ceil(randint(params.minCredit, params.maxCredit) / params.creditsPerSubject),
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
        Math.max(0, Math.min(100, studentBaseAttendance + uniform(-2.5, 2.5)))
      );
    
      if (isPerfectScorer) {
        semesterGpa = 4.0;
      } else {
        // Base GPA influenced by pre-grad and previous semesters
        let baseGpa = preGradUniGpa * w_preGrad + prevAccumulatedGpa * w_accum;
    
        // Random noise per semester
        baseGpa += uniform(-0.2, 0.2);
    
        // Exceptional performance adjustment
        if (performanceGroup !== 'High' && Math.random() < params.exceptionPercentage) {
          const exceptionalSwing = 0.35;
          baseGpa += getExceptionalPerformanceGroup(performanceGroup) === 'High' ? exceptionalSwing : -exceptionalSwing;
        }
    
        // High performer "perfect score push"
        if (performanceGroup === 'High') {
          const perfectScorePush = (preGradUniGpa / 4.0) * params.preGradScoreInfluence;
          baseGpa = baseGpa * (1 - perfectScorePush) + 4.0 * perfectScorePush;
        }
    
        // Credit and attendance impact
        semesterGpa = baseGpa + creditImpact(actualCredits, params);
        const attendanceImpact = (attendancePercentage - 82.5) / 17.5 * params.attendanceImpact;
        semesterGpa += attendanceImpact;
    
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
          ? 4.0
          : Math.max(0, Math.min(4.0, semesterGpa + uniform(-0.1, 0.1)));
        semesterData[subject] = gpaToGrade(finalGpaForSubject, normalizedGradeScaleTuples);
      }
    
      semesters[String(semesterId)] = semesterData;
      semesterId++;
    }

    students.push({
      student_id: student_id,
      ssc_gpa: ssc_gpa,
      hsc_gpa: hsc_gpa,
      gender: choice(['male', 'female']),
      birth_year: randint(minBirthYear, maxBirthYear),
      department: department,
      semesters: semesters,
    });
  }

  return students;
}
