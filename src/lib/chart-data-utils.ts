
import type { StudentWithCgpa } from "@/lib/types";

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
