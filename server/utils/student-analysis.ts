const GRADE_TO_GPA: Record<string, number> = {
  "A+": 4.0,
  "A": 3.75,
  "A-": 3.5,
  "B+": 3.25,
  "B": 3.0,
  "B-": 2.75,
  "C+": 2.5,
  "C": 2.25,
  "D": 2.0,
  "F": 0.0,
};

const NON_COURSE_KEYS = new Set([
  "creditHours",
  "creditLoad",
  "credits",
  "attendancePercentage",
  "attendance",
  "attendance_percentage",
  "gpa",
  "grade",
  "score",
  "semesterName",
  "semester",
  "details",
]);

type SemesterSnapshot = {
  gpa: number | null;
  creditLoad: number | null;
  attendance: number | null;
};

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const calculateSemesterGpa = (semester: Record<string, unknown>, creditsPerSubject = 3): number | null => {
  const searchLocations: Record<string, unknown>[] = [semester];
  if (semester.details && typeof semester.details === "object") {
    searchLocations.push(semester.details as Record<string, unknown>);
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const location of searchLocations) {
    for (const [key, value] of Object.entries(location)) {
      if (NON_COURSE_KEYS.has(key)) continue;
      if (typeof value === "string" && value in GRADE_TO_GPA) {
        totalPoints += GRADE_TO_GPA[value] * creditsPerSubject;
        totalCredits += creditsPerSubject;
      }
    }
    if (totalCredits > 0) break;
  }

  if (totalCredits === 0) return null;
  return Number((totalPoints / totalCredits).toFixed(2));
};

const extractSemesters = (student: Record<string, any>): Record<string, unknown>[] => {
  if (Array.isArray(student.semesters)) {
    return student.semesters.filter((semester: unknown) => typeof semester === "object" && semester !== null);
  }
  if (student.semesters && typeof student.semesters === "object") {
    const entries = Object.entries(student.semesters as Record<string, unknown>);
    return entries
      .sort(([a], [b]) => {
        const aNum = Number(a);
        const bNum = Number(b);
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
          return aNum - bNum;
        }
        return String(a).localeCompare(String(b));
      })
      .map(([, value]) => value)
      .filter((semester) => typeof semester === "object" && semester !== null) as Record<string, unknown>[];
  }
  if (Array.isArray(student.semesterDetails)) {
    return student.semesterDetails.filter((semester: unknown) => typeof semester === "object" && semester !== null);
  }
  return [];
};

const buildSemesterSnapshot = (semester: Record<string, unknown>): SemesterSnapshot => {
  const details = typeof semester.details === "object" && semester.details !== null
    ? semester.details as Record<string, unknown>
    : null;
  const creditLoad = coerceNumber(semester.creditLoad ?? semester.creditHours ?? semester.credits)
    ?? (details ? coerceNumber(details.creditLoad ?? details.creditHours ?? details.credits) : null);
  const attendance = coerceNumber(semester.attendancePercentage ?? semester.attendance ?? semester.attendance_percentage);

  return {
    gpa: calculateSemesterGpa(semester),
    creditLoad,
    attendance,
  };
};

export const analyzeSingleStudent = (student: Record<string, any>) => {
  const semesters = extractSemesters(student).map(buildSemesterSnapshot);

  const gpaTrend = semesters
    .map((semester, index) => ({
      name: `Sem ${index + 1}`,
      gpa: semester.gpa,
    }))
    .filter((entry) => entry.gpa !== null) as Array<{ name: string; gpa: number }>;

  const creditLoad = semesters
    .map((semester, index) => ({
      semester: index + 1,
      credits: semester.creditLoad,
      gpa: semester.gpa,
    }))
    .filter((entry) => entry.gpa !== null && entry.credits !== null) as Array<{ semester: number; credits: number; gpa: number }>;

  const attendanceTrend = semesters
    .map((semester, index) => {
      if (semester.gpa === null || semester.attendance === null) return null;
      const prevGpa = index > 0 && semesters[index - 1]?.gpa !== null
        ? semesters[index - 1].gpa!
        : semester.gpa;
      const gradeChangeRate = ((semester.gpa - prevGpa) / 4) * 100;
      return {
        name: `Sem ${index + 1}`,
        attendance: semester.attendance,
        gradeChangeRate: Number(gradeChangeRate.toFixed(2)),
      };
    })
    .filter((entry): entry is { name: string; attendance: number; gradeChangeRate: number } => entry !== null);

  return {
    gpaTrend,
    creditLoad,
    attendanceTrend,
  };
};

export const detectDatasetType = (data: unknown): "dataset" | "single" | null => {
  if (Array.isArray(data)) return "dataset";
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.students)) return "dataset";
    if ("student_id" in record || "studentId" in record || "semesters" in record || "semesterDetails" in record) {
      return "single";
    }
  }
  return null;
};
