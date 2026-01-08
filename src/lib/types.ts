export interface Student {
  id: string;
  name: string;
  department: string;
  cgpa?: number;
  pre_grad_gpa?: number;
  semesters?: Record<string, any> | any[];
  semesterDetails?: any[]; 
  avg_attendance?: number;
}

export interface StudentWithCgpa extends Student {
  cgpa: number;
}

export interface Semester {
  semesterName: string;
  creditHours: number;
  attendancePercentage: number;
  gpa: number;
  [key: string]: any; 
}

export interface GenerationParams {
  stdCredit: number;
  maxCreditImpact: number;
  creditsPerSubject?: number;
}

export interface CgpaDistributionData {
  cgpa: number;
  students: number;
}

export interface HscVsCgpaDensityData {
  preGpa: number;
  uniCgpa: number;
  count: number;
  z: number;
}

export interface CreditLoadVsGradeData {
  creditLoad: number;
  avgGpa: number;
}

export interface AnalysisSummary {
  totalStudents: number;
  avgCgpa?: number;
  medianCgpa?: number;
  cgpaDistribution: CgpaDistributionData[];
  departmentDistribution: Record<string, number>;
  performance_distribution: Record<string, number>; 
  hscVsCgpaDensity: HscVsCgpaDensityData[];
  creditLoadVsGrade: CreditLoadVsGradeData[];
  topPerformers?: Student[];
  lowPerformers?: Student[];
  avgAttendance?: number;
  lowAttendanceStudents?: Student[];
}
