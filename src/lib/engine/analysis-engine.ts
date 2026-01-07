'use client';

import type { Student, StudentWithCgpa, AnalysisSummary, PerformanceGroup, GenerationParams } from "@/lib/types";
import { GRADE_SCALE } from "@/lib/types";

/**
 * The AnalysisEngine is responsible for all deterministic calculations on a given dataset.
 * It takes student data and parameters, and produces a complete analysis without any randomness.
 */
export class AnalysisEngine {
  private students: Student[];
  private params: GenerationParams;

  constructor(students: Student[], params: GenerationParams) {
    this.students = students;
    this.params = params;
  }

  /**
   * Runs the complete analysis suite.
   */
  public run(): { data: StudentWithCgpa[], summary: AnalysisSummary } {
    const studentsWithCgpa = this.students.map(student => this.calculateCgpa(student));
    const summary = this.calculateSummary(studentsWithCgpa);
    return { data: studentsWithCgpa, summary };
  }

  /**
   * Calculates the CGPA for a single student based on their semester grades.
   * This is a deterministic calculation.
   */
  private calculateCgpa(student: Student): StudentWithCgpa {
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const semesterId in student.semesters) {
      const semester = student.semesters[semesterId];
      let semesterSubjectsGradePoints = 0;
      let semesterSubjectCredits = 0;

      for (const subject in semester) {
        if (subject !== 'creditHours' && subject !== 'attendancePercentage') {
          const grade = semester[subject] as keyof typeof GRADE_SCALE;
          semesterSubjectsGradePoints += (GRADE_SCALE[grade] || 0) * this.params.creditsPerSubject;
          semesterSubjectCredits += this.params.creditsPerSubject;
        }
      }

      if (semesterSubjectCredits > 0) {
        totalGradePoints += semesterSubjectsGradePoints;
        totalCredits += semesterSubjectCredits;
      }
    }

    const cgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
    return { ...student, cgpa, performanceGroup: this.classifyPerformance(cgpa) };
  }

  /**
   * Classifies a student's performance based on their CGPA.
   */
  private classifyPerformance(cgpa: number): PerformanceGroup {
    if (cgpa >= 3.6) return 'High';
    if (cgpa >= 2.5) return 'Mid';
    return 'Low';
  }

  /**
   * Calculates the summary statistics for the entire dataset.
   */
  private calculateSummary(students: StudentWithCgpa[]): AnalysisSummary {
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
}
