"use server";

import { generateSyntheticData } from "@/lib/data-generator";
import type { GenerationParams, Student, StudentWithCgpa, GenerationResult, Grade, AnalysisSummary } from "@/lib/types";
import { GRADE_SCALE } from "@/lib/types";

function getPerformanceGroup(cgpa: number): 'High' | 'Mid' | 'Low' {
    if (cgpa >= 3.5) return 'High';
    if (cgpa < 2.0) return 'Low';
    return 'Mid';
}

function calculateStudentCgpa(student: Student): StudentWithCgpa {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const semesterId in student.semesters) {
    const semester = student.semesters[semesterId];
    let semesterPoints = 0;
    let semesterSubjectCount = 0;

    for (const key in semester) {
      if (key !== 'creditHours' && key !== 'attendancePercentage') {
        const grade = semester[key] as Grade;
        semesterPoints += GRADE_SCALE[grade] || 0;
        semesterSubjectCount++;
      }
    }
    
    if (semesterSubjectCount > 0) {
      const semesterGpa = semesterPoints / semesterSubjectCount;
      totalPoints += semesterGpa * semester.creditHours;
      totalCredits += semester.creditHours;
    }
  }

  const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  return { ...student, cgpa };
}

function calculateSummary(students: StudentWithCgpa[]): AnalysisSummary {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return { totalStudents: 0, avgHscGpa: "0", avgCgpa: "0", departmentDistribution: {}, performanceDistribution: {}, hscVsCgpa: [], creditLoadVsGrade: [], attendanceVsGrade: [], cgpaDistribution: {}, creditDistribution: {}, semesterCountDistribution: {}};
  }

  const totalHscGpa = students.reduce((sum, s) => sum + s.hsc_gpa, 0);
  const totalCgpa = students.reduce((sum, s) => sum + s.cgpa, 0);

  const departmentDistribution = students.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const performanceDistribution = students.reduce((acc, s) => {
    const group = getPerformanceGroup(s.cgpa);
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hscVsCgpa = students.map(s => ({ hsc_gpa: s.hsc_gpa, cgpa: s.cgpa }));

  return {
    totalStudents,
    avgHscGpa: (totalHscGpa / totalStudents).toFixed(2),
    avgCgpa: (totalCgpa / totalStudents).toFixed(2),
    departmentDistribution,
    performanceDistribution,
    hscVsCgpa,
    creditLoadVsGrade: [], 
    attendanceVsGrade: [],
    cgpaDistribution: {},
    creditDistribution: {},
    semesterCountDistribution: {}
  };
}

export async function processUploadedData(data: Student[]): Promise<GenerationResult> {
    try {
        const studentsWithCgpa = data.map(calculateStudentCgpa);
        const summary = calculateSummary(studentsWithCgpa);
        const insights = [];
        
        return {
            data: studentsWithCgpa,
            summary,
            insights
        };

    } catch (error) {
        console.error("Data processing failed:", error);
        throw new Error("Failed to process uploaded data.");
    }
}


export async function generateDataAction(params: GenerationParams): Promise<GenerationResult> {
  try {
    const rawData = generateSyntheticData(params);
    const studentsWithCgpa = rawData.map(calculateStudentCgpa);
    const summary = calculateSummary(studentsWithCgpa);

    const insights = [];

    return {
      data: studentsWithCgpa,
      summary,
      insights,
    };
  } catch (error) {
    console.error("Data generation failed:", error);
    throw new Error("Failed to generate synthetic data.");
  }
}
