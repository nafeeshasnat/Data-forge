import { z } from "zod";

export const GradeSchema = z.enum([
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "D",
  "F",
]);

export const SemesterSchema = z
  .object({
    creditHours: z.number(),
    attendancePercentage: z.number(),
  })
  .catchall(z.union([GradeSchema, z.number()]));

export const StudentSchema = z.object({
  student_id: z.number(),
  ssc_gpa: z.number(),
  hsc_gpa: z.number(),
  gender: z.enum(["male", "female"]),
  birth_year: z.number(),
  department: z.string(),
  semesters: z.record(SemesterSchema),
});

export const StudentDatasetSchema = z.array(StudentSchema);

export const GradeScaleSchema = z.object({
  "A+": z.number(),
  "A": z.number(),
  "A-": z.number(),
  "B+": z.number(),
  "B": z.number(),
  "B-": z.number(),
  "C+": z.number(),
  "C": z.number(),
  "D": z.number(),
  "F": z.number(),
});
