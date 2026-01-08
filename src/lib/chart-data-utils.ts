
import type { StudentWithCgpa, Semester, CreditLoadVsGradeData } from "@/lib/types";

export function getCgpaDistributionData(students: StudentWithCgpa[]) {
  if (!students || students.length === 0) {
    return [];
  }

  const bins: Record<string, number> = {};
  const binSize = 0.2;

  students.forEach(student => {
    const adjustedCgpa = student.cgpa >= 4.0 ? 3.99 : student.cgpa;
    const bin = Math.floor(adjustedCgpa / binSize) * binSize;
    const binKey = bin.toFixed(2);
    if (!bins[binKey]) {
      bins[binKey] = 0;
    }
    bins[binKey]++;
  });

  const data = [];
  for (let i = 0; i < 4.0; i += binSize) {
    const binKey = i.toFixed(2);
    data.push({
      cgpa: i + binSize / 2,
      students: bins[binKey] || 0,
    });
  }
  return data;
}

export function getHscVsCgpaData(students: StudentWithCgpa[]) {
  if (!students) return [];
  return students.map(student => ({
    hscGpa: student.hsc_gpa,
    cgpa: student.cgpa,
  }));
}

const GRADE_SCALE: Record<string, number> = {
    "A+": 4.00, "A": 3.75, "A-": 3.50,
    "B+": 3.25, "B": 3.00, "B-": 2.75,
    "C+": 2.50, "C": 2.25,
    "D": 2.00, "F": 0.00
};

const calculateGpaFromGrades = (semester: Omit<Semester, 'creditHours' | 'attendancePercentage'>): number => {
    let totalPoints = 0;
    let subjectCount = 0;
    for (const key in semester) {
        const grade = semester[key as keyof typeof semester];
        if (typeof grade === 'string' && GRADE_SCALE[grade] !== undefined) {
            totalPoints += GRADE_SCALE[grade];
            subjectCount++;
        }
    }
    return subjectCount > 0 ? totalPoints / subjectCount : 0;
};

export function computeCreditLoadVsGradeData(students: StudentWithCgpa[]): CreditLoadVsGradeData[] {
    if (!students) return [];
    
    const creditBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      if (student.semesters && typeof student.semesters === 'object') {
        Object.values(student.semesters).forEach((semester: any) => {
            const gpa = calculateGpaFromGrades(semester);
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
