import type { GenerationParams, Student, Semester, Grade, PerformanceGroup } from './types';
import { DEPARTMENTS, SUBJECTS } from './subjects';

function generateSubjectPool(department: string): string[] {
    const baseSubjects = SUBJECTS[department];
    const subjectPool: string[] = [];
    const totalSubjects = 60;
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

const PERFORMANCE_BOUNDARIES: Record<PerformanceGroup, { ssc: [number, number], hsc: [number, number], uni: [number, number] }> = {
    High: { ssc: [3.5, 5.0], hsc: [3.5, 5.0], uni: [2.7, 4.0] },
    Mid:  { ssc: [2.5, 4.5], hsc: [2.5, 4.5], uni: [2.2, 3.7] },
    Low:  { ssc: [2.0, 4.0], hsc: [2.0, 3.8], uni: [2.0, 3.0] },
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

function generateGpaInBounds(group: PerformanceGroup, type: 'ssc' | 'hsc' ): number {
    const [min, max] = PERFORMANCE_BOUNDARIES[group][type];
    return uniform(min, max);
}

function gpaToGrade(gpa: number): Grade {
  for (const [grade, value] of GRADE_SCALE_tuples) {
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
  const currentYear = new Date().getFullYear();
  const maxBirthYear = currentYear - 18;
  const minBirthYear = maxBirthYear - 7;
  const totalCreditsRequired = 60 * params.creditsPerSubject;

  for (let sid = 1; sid <= params.numStudents; sid++) {
    const performanceGroup = selectPerformanceGroup(params);
    const department = choice(DEPARTMENTS);
    const ssc_gpa = generateGpaInBounds(performanceGroup, 'ssc');
    const hsc_gpa = generateGpaInBounds(performanceGroup, 'hsc');
    
    const preGradUniGpa = ((ssc_gpa / 5.0) + (hsc_gpa / 5.0)) / 2 * 4.0;

    const isPerfectScorer = performanceGroup === 'High' && preGradUniGpa > 3.8 && Math.random() < 0.8;

    const fullSubjectPool = generateSubjectPool(department);
    const studentSubjectPool = shuffle([...fullSubjectPool]).slice(0, 60);

    const semesters: Record<string, Semester> = {};
    let semesterId = 1;
    let subjectsToAssign = [...studentSubjectPool];
    // Assign a floating-point base attendance for more diversity
    const studentBaseAttendance = uniform(60, 98);

    while (subjectsToAssign.length > 0) {
      const subjectCount = Math.min(Math.ceil(randint(params.minCredit, params.maxCredit) / params.creditsPerSubject), subjectsToAssign.length);
      const actualCredits = subjectCount * params.creditsPerSubject;

      const semesterSubjects = subjectsToAssign.splice(0, subjectCount);

      let semesterGpa: number;
      
      if (isPerfectScorer) {
        semesterGpa = 4.0;
      } else {
          let gpa = preGradUniGpa + uniform(-0.4, 0.4);

          if (performanceGroup !== 'High' && Math.random() < params.exceptionPercentage) {
            gpa += getExceptionalPerformanceGroup(performanceGroup) === 'High' ? 0.75 : -0.75;
          }

          if (performanceGroup === 'High') {
            const perfectScorePush = (preGradUniGpa / 4.0) * params.preGradScoreInfluence;
            gpa = gpa * (1 - perfectScorePush) + 4.0 * perfectScorePush;
          }
          
          semesterGpa = gpa + creditImpact(actualCredits, params);
      }
      
      // Add small variance to the base attendance for each semester
      const attendancePercentage = Math.max(0, Math.min(100, studentBaseAttendance + uniform(-2.5, 2.5)));

      const semesterData: Semester = {
        creditHours: actualCredits,
        attendancePercentage: attendancePercentage
      };

      const attendanceImpact = (attendancePercentage - 82.5) / 17.5 * params.attendanceImpact;

      for (const subject of semesterSubjects) {
        let finalGpaForSubject: number;
        if (isPerfectScorer) {
            finalGpaForSubject = 4.0;
        } else {
            let noisyGpa = semesterGpa + uniform(-0.1, 0.1);
            noisyGpa += attendanceImpact;

            if (semesterId === 1 && Math.random() < 0.05) { 
                noisyGpa = 0.0;
            }
            finalGpaForSubject = Math.max(0.0, Math.min(4.0, noisyGpa));
        }
        
        const grade = gpaToGrade(finalGpaForSubject);
        semesterData[subject] = grade;
      }
      
      semesters[String(semesterId)] = semesterData;

      semesterId++;
    }

    students.push({
      student_id: 700100000 + sid,
      ssc_gpa: ssc_gpa,
      hsc_gpa: hsc_gpa,
      gender: choice(['male', 'female']),
      birth_year: randint(minBirthYear, maxBirthYear),
      department: department,
      semesters: semesters,
      total_credits_required: totalCreditsRequired,
    });
  }

  return students;
}
