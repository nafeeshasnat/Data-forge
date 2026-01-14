export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

export type Semester = {
    creditHours: number;
    attendancePercentage: number;
    [subject: string]: Grade | number; 
};

export type Student = {
    id?: string | number;
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
    performanceGroup?: PerformanceGroup;
    avgCreditLoad?: number;
    avgAttendance?: number;
    semesterDetails?: Array<{
        gpa: number;
        creditLoad: number;
    }>;
};

export type StudentWithSemesterDetails = StudentWithCgpa & {
    semesterDetails: Array<{
        gpa: number;
        creditLoad: number;
    }>;
};
  
export type GenerationParams = {
    numStudents: number;
    highPerformanceChance: number;
    lowPerformanceChance: number;
    exceptionPercentage: number;
    attendanceImpact: number;
    failChance?: number;
    perfectScorerChance?: number;
    preGradDecay?: number;
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
    seed?: number | string;
    transitionShock?: {
        hscMin: number;
        maxSemesters: number;
        drop: number;
    };
    cgpaTargetHistogram?: Array<{ cgpa: number; students: number }>;
    cgpaHighTailThreshold?: number;
    cgpaHighTailBoost?: number;
    cgpaHighTailWeight?: number;
};

export type PerformanceGroup = 'High' | 'Mid' | 'Low';

export type DistributionEntry = { name: string; value: number };
export type DistributionMap = Record<string, number>;

export type CgpaDistribution = { cgpa: number; students: number };
export type CreditLoadVsGradeData = { creditLoad: number; avgGpa: number };
export type AttendanceVsGradeData = { attendance: number; avgGpa: number };
export type HscVsCgpaDensityData = { preGpa: number; uniCgpa: number; count: number; z: number };

export type AnalysisSummary = {
  totalStudents?: number;
  avgCgpa?: number;
  avgHscGpa?: number;
  avgCreditLoad?: number;
  avgAttendance?: number;
  performanceDistribution?: DistributionEntry[] | DistributionMap;
  departmentDistribution?: DistributionEntry[] | DistributionMap;
  total_students?: number;
  avg_cgpa?: number;
  avg_attendance?: number;
  performance_distribution?: DistributionEntry[] | DistributionMap;
  department_distribution?: DistributionEntry[] | DistributionMap;
  [key: string]: any; // Allow other keys
};

export type GenerationResult = {
  data: StudentWithCgpa[];
  summary: AnalysisSummary;
  insights: string[];
  params?: GenerationParams;
};
