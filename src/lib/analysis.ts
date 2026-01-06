import type { Student, StudentWithCgpa, DataSummary, PerformanceGroup } from "./types";
import { GRADE_SCALE } from "./types";

function calculateCgpa(student: Student): StudentWithCgpa {
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const semesterId in student.semesters) {
    const semester = student.semesters[semesterId];
    for (const subject in semester) {
      if (subject !== 'creditHours' && subject !== 'attendancePercentage') {
        const grade = semester[subject] as keyof typeof GRADE_SCALE;
        totalGradePoints += GRADE_SCALE[grade] * 3; // Assuming 3 credits per subject
        totalCredits += 3;
      }
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

export function analyzeData(students: Student[]): { data: StudentWithCgpa[], summary: DataSummary } {
  const studentsWithCgpa = students.map(calculateCgpa);

  const totalStudents = students.length;
  const avgHscGpa = parseFloat((students.reduce((sum, s) => sum + s.hsc_gpa, 0) / totalStudents).toFixed(2));
  const avgCgpa = parseFloat((studentsWithCgpa.reduce((sum, s) => sum + s.cgpa, 0) / totalStudents).toFixed(2));

  const departmentDistribution = students.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const performanceDistribution = studentsWithCgpa.reduce((acc, s) => {
    acc[s.performanceGroup] = (acc[s.performanceGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const summary: DataSummary = {
    totalStudents,
    avgHscGpa,
    avgCgpa,
    departmentDistribution,
    performanceDistribution,
  };

  return { data: studentsWithCgpa, summary };
}
