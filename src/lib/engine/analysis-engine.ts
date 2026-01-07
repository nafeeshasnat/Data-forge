'use client';

import type { Student, StudentWithCgpa, AnalysisSummary, PerformanceGroup, GenerationParams } from "@/lib/types";
import { GRADE_SCALE } from "@/lib/types";

/**
 * A simple string hashing function for deterministic shuffling.
 * @param str The string to hash.
 * @returns A 32-bit integer hash.
 */
const simpleStringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * The AnalysisEngine is responsible for all deterministic calculations on a given dataset.
 * It takes student data and parameters, and produces a complete analysis without any randomness.
 */
export class AnalysisEngine {
  private students: Student[];
  private params: GenerationParams;
  private studentsWithCgpa: StudentWithCgpa[];

  constructor(students: Student[], params: GenerationParams) {
    this.students = students;
    this.params = params;
    // Pre-calculate CGPA for all students on construction, as it's needed for trimming.
    this.studentsWithCgpa = this.students.map(student => this.calculateCgpa(student));
  }

  /**
   * Runs the complete analysis suite.
   */
  public run(): { data: StudentWithCgpa[], summary: AnalysisSummary, insights: string[] } {
    const summary = this.calculateSummary(this.studentsWithCgpa);
    const insights = this.generateInsights(summary);
    return { data: this.studentsWithCgpa, summary, insights };
  }
  
  /**
   * Trims a percentage of students from a specified CGPA range in a deterministic but pseudo-random way.
   * This method is deterministic.
   * @param minCgpa The minimum CGPA of the range.
   * @param maxCgpa The maximum CGPA of the range.
   * @param percentage The percentage of students to remove from the range (0-100).
   * @returns A new array of students with the specified students removed.
   */
  public trimData(minCgpa: number, maxCgpa: number, percentage: number): StudentWithCgpa[] {
    const studentsInRange = this.studentsWithCgpa.filter(s => s.cgpa >= minCgpa && s.cgpa <= maxCgpa);
    const studentsOutOfRange = this.studentsWithCgpa.filter(s => s.cgpa < minCgpa || s.cgpa > maxCgpa);

    const numToRemove = Math.floor(studentsInRange.length * (percentage / 100));

    // Deterministically shuffle students in the range by sorting based on a hash of their ID.
    // This ensures a pseudo-random distribution that is repeatable.
    studentsInRange.sort((a, b) => simpleStringHash(a.id) - simpleStringHash(b.id));

    const trimmedStudentsInRange = studentsInRange.slice(numToRemove);

    const newStudentList = [...studentsOutOfRange, ...trimmedStudentsInRange];
    
    // Sort the final list by student ID for consistent order in the UI.
    newStudentList.sort((a, b) => a.id.localeCompare(b.id));

    return newStudentList;
  }

  /**
   * Generates a list of key insights from the analysis summary.
   * @param summary The analysis summary.
   * @returns An array of human-readable insights.
   */
  private generateInsights(summary: AnalysisSummary): string[] {
    const insights: string[] = [];
    const { totalStudents, avgCgpa, avgHscGpa, performanceDistribution, departmentDistribution } = summary;

    if (totalStudents === 0) {
      return ["No students in the dataset to analyze."];
    }

    // Insight 1: Dominant Performance Group
    const performanceGroups = Object.entries(performanceDistribution).sort((a, b) => b[1] - a[1]);
    if (performanceGroups.length > 0) {
      const dominantGroup = performanceGroups[0][0];
      const dominantPercentage = ((performanceGroups[0][1] / totalStudents) * 100).toFixed(0);
      insights.push(`The majority of students (${dominantPercentage}%) fall into the '${dominantGroup}' performance category.`);
    }

    // Insight 2: CGPA vs HSC GPA comparison
    if (avgCgpa < avgHscGpa - 0.5) {
      insights.push(`The average CGPA (${avgCgpa}) is significantly lower than the average HSC GPA (${avgHscGpa}), suggesting a challenging academic transition.`);
    } else if (avgCgpa > avgHscGpa + 0.2) {
      insights.push(`Students, on average, perform better in university (Avg CGPA: ${avgCgpa}) than they did in HSC (Avg GPA: ${avgHscGpa}).`);
    }

    // Insight 3: Department Distribution
    const departments = Object.entries(departmentDistribution).sort((a, b) => b[1] - a[1]);
    if (departments.length > 1) {
      const largestDept = departments[0][0];
      insights.push(`The department with the most students is ${largestDept}.`);
    }

    // Insight 4: High and Low Performers
    const highPerformers = performanceDistribution['High'] || 0;
    const lowPerformers = performanceDistribution['Low'] || 0;
    const highPerformerPercentage = ((highPerformers / totalStudents) * 100).toFixed(0);
    const lowPerformerPercentage = ((lowPerformers / totalStudents) * 100).toFixed(0);

    if (highPerformers > 0) {
        insights.push(`${highPerformerPercentage}% of students are high-performers (CGPA >= 3.6).`);
    }
     if (lowPerformers > 0) {
        insights.push(`${lowPerformerPercentage}% of students are low-performers (CGPA < 2.5).`);
    }


    return insights;
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
