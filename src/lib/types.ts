export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

export type Semester = {
    creditHours: number;
    attendancePercentage: number;
    [subject: string]: Grade | number; 
};

export type Student = {
    student_id: number;
    ssc_gpa: number;
    hsc_gpa: number;
    gender: 'male' | 'female';
    birth_year: number;
    department: string;
    semesters: Record<string, Semester>;
};

export type StudentWithCgpa = Student & {
    cgpa: number;
};
  
export type GenerationParams = {
    numStudents: number;
    highPerformanceChance: number;
    lowPerformanceChance: number;
    exceptionPercentage: number;
    attendanceImpact: number;
    preGradScoreInfluence: number;
    creditsPerSubject: number;
    minCredit: number;
    maxCredit: number;
    stdCredit: number;
    maxCreditImpact: number;
    gradeScale?: Record<Grade, number>;
    analysisPerformanceThresholds?: {
        high: number;
        mid: number;
    };
};

export type PerformanceGroup = 'High' | 'Mid' | 'Low';

export type AnalysisSummary = {
  total_students: number;
  avg_cgpa: number;
  avg_attendance: number;
  performance_distribution: { name: string; value: number }[];
  department_distribution: { name: string; value: number }[];
  [key: string]: any; // Allow other keys
};
