"use server";

import { generateSyntheticData } from "@/lib/data-generator";
import type { GenerationParams, Student, StudentWithCgpa, DataSummary, GenerationResult, Grade } from "@/lib/types";
import { GRADE_SCALE } from "@/lib/types";

function calculateStudentCgpa(student: Student): StudentWithCgpa {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const semesterId in student.semesters) {
    const semester = student.semesters[semesterId];
    let semesterPoints = 0;
    let semesterSubjectCount = 0;

    for (const key in semester) {
      if (key !== 'credit_hr' && key !== 'attendancePercentage') {
        const grade = semester[key] as Grade;
        semesterPoints += GRADE_SCALE[grade] || 0;
        semesterSubjectCount++;
      }
    }
    
    if (semesterSubjectCount > 0) {
      const semesterGpa = semesterPoints / semesterSubjectCount;
      totalPoints += semesterGpa * semester.credit_hr;
      totalCredits += semester.credit_hr;
    }
  }

  const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  return { ...student, cgpa };
}

function calculateSummary(students: StudentWithCgpa[]): DataSummary {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return { totalStudents: 0, avgHscGpa: 0, avgCgpa: 0, departmentDistribution: {}, performanceDistribution: {} };
  }

  const totalHscGpa = students.reduce((sum, s) => sum + s.hsc_gpa, 0);
  const totalCgpa = students.reduce((sum, s) => sum + s.cgpa, 0);

  const departmentDistribution = students.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const performanceDistribution = students.reduce((acc, s) => {
    acc[s.performance_group] = (acc[s.performance_group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalStudents,
    avgHscGpa: parseFloat((totalHscGpa / totalStudents).toFixed(2)),
    avgCgpa: parseFloat((totalCgpa / totalStudents).toFixed(2)),
    departmentDistribution,
    performanceDistribution,
  };
}

export async function generateDataAction(params: GenerationParams): Promise<GenerationResult> {
  try {
    const rawData = generateSyntheticData(params);
    const studentsWithCgpa = rawData.map(calculateStudentCgpa);
    const summary = calculateSummary(studentsWithCgpa);

    // Mock AI insight as per project constraints
    const insights = "The generated dataset appears well-balanced across departments and performance levels. The correlation between HSC GPA and university performance is noticeable, as expected. To explore different scenarios, try increasing the 'Max Credit Impact' to see how a heavier workload affects student grades.";

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
