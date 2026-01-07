export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

export const GRADE_SCALE: Record<Grade, number> = {
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

export interface Semester {
  [subject: string]: Grade | number;
  creditHours: number;
  attendancePercentage: number;
}

export interface Student {
  student_id: number;
  gender: "male" | "female";
  birth_year: number;
  department: string;
  ssc_gpa: number;
  hsc_gpa: number;
  semesters: Record<string, Semester>;
}

export interface StudentWithCgpa extends Student {
  cgpa: number;
}

export interface GenerationParams {
  numStudents: number;
  creditsPerSubject: number;
  minCredit: number;
  stdCredit: number;
  maxCredit: number;
  maxCreditImpact: number;
  highPerformanceChance: number;
  lowPerformanceChance: number;
  preGradScoreInfluence: number;
  exceptionPercentage: number;
  attendanceImpact: number;
}

export type PerformanceGroup = 'High' | 'Mid' | 'Low';

export interface AnalysisSummary {
  totalStudents: number;
  avgCgpa: string;
  avgHscGpa: string;
  departmentDistribution: Record<string, number>;
  cgpaDistribution: Record<string, number>;
  creditDistribution: Record<string, number>;
  semesterCountDistribution: Record<string, number>;
  performanceDistribution: Record<string, number>;
  hscVsCgpa: { hsc_gpa: number; cgpa: number }[];
  creditLoadVsGrade: { credit_load: number; avg_gpa: number }[];
  attendanceVsGrade: { attendance_percentage: number; avg_gpa: number }[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  strength: 'high' | 'medium' | 'low';
}

export interface GenerationResult {
  data: StudentWithCgpa[];
  summary: AnalysisSummary;
  insights: Insight[];
}
