import type { GenerationParams, Student, Semester, Grade } from './types';
import { DEPARTMENTS, SUBJECTS } from './subjects';

function generateSubjectPool(department: string): string[] {
    const baseSubjects = SUBJECTS[department];
    const subjectPool: string[] = [];
    const totalSubjects = 50; 
    for (let i = 0; i < totalSubjects; i++) {
        subjectPool.push(`${baseSubjects[i % baseSubjects.length]}`);
    }
    return [...new Set(subjectPool)];
}


const GRADE_SCALE_tuples: [Grade, number][] = [
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

function triangular(low: number, high: number, mode: number): number {
  const u = Math.random();
  const f = (mode - low) / (high - low);
  if (u < f) {
    return low + Math.sqrt(u * (high - low) * (mode - low));
  }
  return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

function pickPerformanceGroup(params: GenerationParams): 'high' | 'mid' | 'fail' {
  const r = Math.random();
  const { highPerformanceChance, failChance } = params;
  if (r < highPerformanceChance) return "high";
  if (r < highPerformanceChance + failChance) return "fail";
  return "mid";
}

function generateGpa(group: 'high' | 'mid' | 'fail', min: number, max: number, mid_min: number, mid_max: number): number {
  let gpa: number;
  if (group === "high") gpa = uniform(max - 0.5, max);
  else if (group === "fail") gpa = uniform(min, min + 1);
  else gpa = uniform(mid_min, mid_max);
  return parseFloat(gpa.toFixed(2));
}

const creditLoad = (params: GenerationParams) => randint(params.minCredit, params.maxCredit);

function creditImpact(credits: number, params: GenerationParams): number {
  const { stdCredit, maxCredit, minCredit, maxCreditImpact } = params;
  const deviation = (credits - stdCredit) / (maxCredit - minCredit);
  return Math.max(-maxCreditImpact, Math.min(maxCreditImpact, -deviation * maxCreditImpact));
}

function baseGpa(group: 'high' | 'mid' | 'fail'): number {
  if (group === "high") return uniform(3.6, 4.0);
  if (group === "fail") return uniform(1.8, 2.4);
  return triangular(2.8, 3.6, 3.3);
}

function gpaToGrade(gpa: number): Grade {
  for (const [grade, value] of GRADE_SCALE_tuples) {
    if (gpa >= value) return grade;
  }
  return "F";
}

export function generateSyntheticData(params: GenerationParams): Student[] {
  const students: Student[] = [];

  for (let sid = 1; sid <= params.numStudents; sid++) {
    const department = choice(DEPARTMENTS);
    const performance = pickPerformanceGroup(params);
    const fullSubjectPool = generateSubjectPool(department);
    const studentSubjectPool = shuffle([...fullSubjectPool]).slice(0, 50);

    const semesters: Record<string, Semester> = {};
    let semesterId = 1;
    let subjectsToAssign = [...studentSubjectPool];

    while (subjectsToAssign.length > 0) {
      const credits = creditLoad(params);
      const subjectCount = Math.min(Math.ceil(credits / params.creditsPerSubject), subjectsToAssign.length);
      const actualCredits = subjectCount * params.creditsPerSubject;

      const semesterSubjects = subjectsToAssign.splice(0, subjectCount);

      const impact = creditImpact(actualCredits, params);
      const semesterGpa = baseGpa(performance) * (1 + impact);
      const clampedSemesterGpa = Math.max(0.0, Math.min(4.0, semesterGpa));

      const semesterData: Semester = {
        creditHours: actualCredits,
        attendancePercentage: randint(65, 100)
      };

      for (const subject of semesterSubjects) {
        const noisyGpa = Math.max(0.0, Math.min(4.0, clampedSemesterGpa + uniform(-0.3, 0.3)));
        semesterData[subject] = gpaToGrade(noisyGpa);
      }

      semesters[String(semesterId)] = semesterData;
      semesterId++;
    }

    students.push({
      student_id: 700100000 + sid,
      ssc_gpa: generateGpa(performance, 2.0, 5.0, 3.0, 4.5),
      hsc_gpa: generateGpa(performance, 2.0, 5.0, 3.0, 4.5),
      gender: choice(['male', 'female']),
      birth_year: randint(1998, 2005),
      department: department,
      semesters: semesters
    });
  }

  return students;
}
