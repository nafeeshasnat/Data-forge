export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F';
export type PerformanceGroup = 'High' | 'Mid' | 'Low';

export interface Semester {
    [subject: string]: Grade | number;
    creditHours: number;
    attendancePercentage: number;
}

export interface Student {
    id: string;
    department: string;
    hsc_gpa: number;
    semesters: Record<string, Semester>; // e.g., { '1-1': { CSE101: 'A+', ... } }
}

export interface StudentWithCgpa extends Student {
    cgpa: number;
    performanceGroup: PerformanceGroup;
    avg_credit_load: number;
    avg_attendance: number;
}

export interface SemesterDetail {
    gpa: number;
    creditLoad: number;
}

export interface StudentWithSemesterDetails extends StudentWithCgpa {
    semesterDetails: SemesterDetail[];
}

export interface GenerationParams {
    totalStudents: number;
    departmentDistribution: Record<string, number>; // e.g., { CSE: 0.6, EEE: 0.4 }
    hscGpaRange: [number, number];
    semestersPerStudent: [number, number];
    subjectsPerSemester: [number, number];
    creditsPerSubject: number;
    attendanceRange: [number, number];
    gpaFactors: {
        hscGpaInfluence: number;
        attendanceInfluence: number;
        creditLoadInfluence: number;
    };
}

export interface AnalysisSummary {
    totalStudents: number;
    avgHscGpa: number;
    avgCgpa: number;
    departmentDistribution: Record<string, number>;
    performanceDistribution: Record<string, number>;
    average_credit_load?: number;
    average_attendance?: number;
}

export interface ChartProps {
    students: StudentWithCgpa[];
    params?: GenerationParams | null; 
    summary?: AnalysisSummary | null;
    insights?: string[] | null;
}
