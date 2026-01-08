export interface Student {
    id: string;
    cgpa: number;
    department: string;
    semesters: Record<string, { creditHours: number; grade: number; attendancePercentage: number; }>;
    
    // Optional fields for detailed analysis
    ssc_gpa?: number;
    hsc_gpa?: number;
    entry_test_score?: number;
    extracurricular_activities?: string[];
    social_engagement?: number; // e.g., hours per week
}

export interface StudentWithCgpa extends Student {
    cgpa: number;
}

export interface GenerationParams {
    stdCredit: number;
    maxCreditImpact: number;
}

export interface AnalysisSummary {
    average_cgpa: number;
    median_cgpa: number;
    performanceDistribution: Record<string, number>;
    departmentDistribution: Record<string, number>;
    hscVsCgpaDensity: { hscGpa: number; cgpa: number; count: number }[];
    top_performers: StudentWithCgpa[];
    low_performers: StudentWithCgpa[];
    average_attendance: number;
    low_attendance_students: StudentWithCgpa[];
    average_credit_load: number;
    overloaded_students: StudentWithCgpa[];
    underloaded_students: StudentWithCgpa[];
}

export interface ChartProps {
    students: StudentWithCgpa[];
    params?: GenerationParams | null; 
    summary?: AnalysisSummary | null;
}
