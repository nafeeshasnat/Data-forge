import type { Student, StudentWithCgpa, DataSummary, PerformanceGroup, GenerationParams } from "./types";
import { GRADE_SCALE } from "./types";

function calculateCgpa(student: Student, params: GenerationParams): StudentWithCgpa {
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const semesterId in student.semesters) {
    const semester = student.semesters[semesterId];
    
    let semesterSubjectsGradePoints = 0;
    let semesterSubjectCredits = 0;

    for (const subject in semester) {
      if (subject !== 'creditHours' && subject !== 'attendancePercentage') {
        const grade = semester[subject] as keyof typeof GRADE_SCALE;
        semesterSubjectsGradePoints += GRADE_SCALE[grade] * params.creditsPerSubject;
        semesterSubjectCredits += params.creditsPerSubject;
      }
    }

    if (semesterSubjectCredits > 0) {
        totalGradePoints += semesterSubjectsGradePoints;
        totalCredits += semesterSubjectCredits;
    }
  }

  const cgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
  return { ...student, cgpa, performanceGroup: classifyPerformance(cgpa) };
}

function classifyPerformance(cgpa: number): PerformanceGroup {
  if (cgpa >= 3.6) return 'High';
  if (cgpa >= 2.5) return 'Mid';
  return 'Low';
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
  }, {} as { [key: string]: number });

  const performanceDistribution = students.reduce((acc, s) => {
    acc[s.performanceGroup] = (acc[s.performanceGroup] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return {
    totalStudents,
    avgHscGpa: parseFloat((totalHscGpa / totalStudents).toFixed(2)),
    avgCgpa: parseFloat((totalCgpa / totalStudents).toFixed(2)),
    departmentDistribution,
    performanceDistribution,
  };
}

export const analyzeData = (students: Student[], params: GenerationParams) => {
  const studentsWithCgpa = students.map(student => calculateCgpa(student, params));
  const summary = calculateSummary(studentsWithCgpa);
  return { data: studentsWithCgpa, summary };
};