import type { GenerationParams, Student, Semester, Grade } from './types';

const DEPARTMENTS = ["CSE", "EEE", "BBA"];

const SUBJECTS: Record<string, string[]> = {
  CSE: ["Introduction to Programming", "Data Structures", "Algorithms", "Database Systems", "Operating Systems", "Computer Networks", "Software Engineering", "Artificial Intelligence", "Machine Learning", "Web Programming", "Compiler Design", "Computer Graphics", "Cyber Security", "Discrete Mathematics", "Digital Logic Design"],
  EEE: ["Basic Electrical Engineering", "Electronic Devices", "Digital Electronics", "Signals and Systems", "Control Systems", "Power Systems", "Electrical Machines", "Power Electronics", "Communication Engineering", "VLSI Design", "Microprocessors", "Embedded Systems", "Renewable Energy", "High Voltage Engineering", "Robotics"],
  BBA: ["Principles of Management", "Principles of Accounting", "Financial Accounting", "Microeconomics", "Macroeconomics", "Business Statistics", "Marketing Principles", "Financial Management", "Human Resource Management", "Organizational Behavior", "Operations Management", "Business Law", "International Business", "Strategic Management", "E-Commerce"],
};

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

function generateHscGpa(group: 'high' | 'mid' | 'fail'): number {
  let gpa: number;
  if (group === "high") gpa = uniform(4.5, 5.0);
  else if (group === "fail") gpa = uniform(2.0, 3.0);
  else gpa = uniform(3.0, 4.5);
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
    const subjectPool = shuffle([...SUBJECTS[department]]);

    const semesters: Record<string, Semester> = {};
    let semesterId = 1;

    while (subjectPool.length > 0) {
      const credits = creditLoad(params);
      const subjectCount = Math.min(Math.ceil(credits / params.creditsPerSubject), subjectPool.length);
      const actualCredits = subjectCount * params.creditsPerSubject;

      const semesterSubjects = subjectPool.splice(0, subjectCount);

      const impact = creditImpact(actualCredits, params);
      const semesterGpa = baseGpa(performance) * (1 + impact);
      const clampedSemesterGpa = Math.max(0.0, Math.min(4.0, semesterGpa));

      const semesterData: Semester = {
        credit_hr: actualCredits,
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
      student_id: 180104000 + sid,
      hsc_gpa: generateHscGpa(performance),
      department: department,
      performance_group: performance,
      semesters: semesters
    });
  }

  return students;
}
