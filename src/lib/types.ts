export interface GenerationParams {
  numStudents: number;
  creditsPerSubject: number;
  minCredit: number;
  stdCredit: number;
  maxCredit: number;
  maxCreditImpact: number;
  highPerformanceChance: number;
  failChance: number;
}

export interface Semester {
  creditHours: number;
  attendancePercentage: number;
  [subject: string]: string | number;
}

export interface Student {
  student_id: number;
  ssc_gpa: number;
  hsc_gpa: number;
  gender: 'male' | 'female';
  birth_year: number;
  department: string;
  semesters: {
    [semesterId: string]: Semester;
  };
}

export interface StudentWithCgpa extends Student {
  cgpa: number;
}

export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

export const GRADE_SCALE: Record<Grade, number> = {
  "A+": 4.00,
  "A": 3.75,
  "A-": 3.50,
  "B+": 3.25,
  "B": 3.00,
  "B-": 2.75,
  "C+": 2.50,
  "C": 2.25,
  "D": 2.00,
  "F": 0.00,
};

export interface DataSummary {
  totalStudents: number;
  avgHscGpa: number;
  avgCgpa: number;
  departmentDistribution: Record<string, number>;
  performanceDistribution: Record<string, number>;
}

export interface GenerationResult {
  data: StudentWithCgpa[];
  summary: DataSummary;
  insights: string;
}
