
import type { StudentWithCgpa, Semester, CreditLoadVsGradeData, AnalysisSummary, Grade } from "@/lib/types";
import { defaultGradeScale } from "@/lib/config";

export function getCgpaDistributionData(students: StudentWithCgpa[]) {
  if (!students || students.length === 0) return [];

  const bins: Record<string, number> = {};
  const binSize = 0.1;
  
  // --- BINNING (Python-equivalent: floor, not round) ---
  students.forEach(student => {
    // cap CGPA just below 4.0 (matches Python)
    const adjustedCgpa = student.cgpa >= 4.0 ? 3.999999 : student.cgpa;
  
    // floor-based binning with FP safety
    const bin = Math.floor((adjustedCgpa + 1e-9) / binSize) * binSize;
    const binKey = bin.toFixed(2);
  
    bins[binKey] = (bins[binKey] || 0) + 1;
  });
  
  // --- BUILD FULL BIN RANGE (no FP drift) ---
  const data = [];
  const totalBins = Math.floor(4.0 / binSize);
  
  for (let step = 0; step < totalBins; step++) {
    const binStart = step * binSize;
    const binKey = binStart.toFixed(2);
  
    data.push({
      cgpa: Number((binStart + binSize / 2).toFixed(2)), // bin center
      students: bins[binKey] || 0,
    });
  }

  return data;
}

export function getHscVsCgpaData(students: StudentWithCgpa[]) {
  if (!students) return [];
  return students.map(student => ({
    preGradGpa: Number((((student.hsc_gpa + student.ssc_gpa) / 2).toFixed(2))),
    cgpa: student.cgpa,
  }));
}

const calculateGpaFromGrades = (
  semester: Omit<Semester, 'creditHours' | 'attendancePercentage'>,
  gradeScale: Record<Grade, number>
): number => {
    let totalPoints = 0;
    let subjectCount = 0;
    for (const key in semester) {
        const grade = semester[key as keyof typeof semester];
        if (typeof grade === 'string' && gradeScale[grade as Grade] !== undefined) {
            totalPoints += gradeScale[grade as Grade];
            subjectCount++;
        }
    }
    return subjectCount > 0 ? totalPoints / subjectCount : 0;
};

export function computeCreditLoadVsGradeData(
  students: StudentWithCgpa[],
  gradeScale: Record<Grade, number> = defaultGradeScale
): CreditLoadVsGradeData[] {
    if (!students) return [];
    
    const creditBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      if (student.semesters && typeof student.semesters === 'object') {
        Object.values(student.semesters).forEach((semester: any) => {
            const gpa = calculateGpaFromGrades(semester, gradeScale);
            if (semester && semester.creditHours != null && gpa != null) {
                const creditBin = Math.round(semester.creditHours / 3) * 3;
                if (!creditBins.has(creditBin)) {
                    creditBins.set(creditBin, { totalGpa: 0, count: 0 });
                }
                const bin = creditBins.get(creditBin)!;
                bin.totalGpa += gpa;
                bin.count++;
            }
        });
      }
    });

    return Array.from(creditBins.entries()).map(([creditLoad, { totalGpa, count }]) => ({
      creditLoad,
      avgGpa: totalGpa / count,
    })).sort((a, b) => a.creditLoad - b.creditLoad);
}

export function getSemesterCountChartData(students: StudentWithCgpa[]) {
  const semesterCounts: Record<string, number> = {};

  students.forEach(student => {
    const count = student.semesters ? Object.keys(student.semesters).length : 0;
    semesterCounts[count] = (semesterCounts[count] || 0) + 1;
  });

  return Object.entries(semesterCounts)
    .map(([semesterCount, studentCount]) => ({
      name: `${semesterCount} Semesters`,
      count: studentCount,
    }))
    .sort((a, b) => {
      const aNum = parseInt(a.name);
      const bNum = parseInt(b.name);
      return aNum - bNum;
    });
}

export function getCreditDistributionChartData(students: StudentWithCgpa[]) {
    const creditCounts: Record<string, number> = {};

    students.forEach(student => {
        if (student.semesters && typeof student.semesters === 'object') {
            Object.values(student.semesters).forEach((semester: any) => {
                if(semester && semester.creditHours) {
                    const credits = semester.creditHours;
                    creditCounts[credits] = (creditCounts[credits] || 0) + 1;
                }
            });
        }
    });

    return Object.entries(creditCounts)
      .map(([creditCount, studentCount]) => ({
        name: `${creditCount} Credits`,
        count: studentCount,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.name);
        const bNum = parseInt(b.name);
        return aNum - bNum;
      });
}

export function getPerformanceDistributionChartData(summary: AnalysisSummary) {
    const performanceLabels = ['High', 'Mid', 'Low'];
    const performanceData = summary.performance_distribution || summary.performanceDistribution || {};
    const normalized = Array.isArray(performanceData)
        ? performanceData.reduce<Record<string, number>>((acc, entry) => {
            acc[entry.name] = entry.value;
            return acc;
          }, {})
        : performanceData;
    return performanceLabels.map(label => ({
        name: label,
        value: normalized[label] || 0,
    }));
}

export function getDepartmentDistributionChartData(summary: AnalysisSummary) {
    const departmentData = summary.department_distribution || summary.departmentDistribution || {};
    const normalized = Array.isArray(departmentData)
        ? departmentData.reduce<Record<string, number>>((acc, entry) => {
            acc[entry.name] = entry.value;
            return acc;
          }, {})
        : departmentData;
    return Object.entries(normalized)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
