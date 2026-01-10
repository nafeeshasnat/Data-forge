'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Semester, StudentWithCgpa } from '@/lib/types';

interface AttendanceVsGradeChartProps {
  students: StudentWithCgpa[];
  plotPoints?: number;
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(266, 47.10%, 47.50%)",
  },
} satisfies ChartConfig;

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

export function AttendanceVsGradeChart({ students, plotPoints = 80 }: AttendanceVsGradeChartProps) {
  const { chartData, xDomain, xTicks } = useMemo(() => {
    if (!students) return { chartData: [], xDomain: [50, 100], xTicks: [] };

    const allSemesters = students.flatMap(student => {
      if (student.semesters && typeof student.semesters === 'object') {
        return Object.values(student.semesters).map((semester: any) => {
          const gpa = calculateGpaFromGrades(semester);
          if (semester && semester.attendancePercentage != null && gpa != null && gpa > 0) {
            return {
              attendancePercentage: semester.attendancePercentage,
              gpa: gpa,
            };
          }
          return null;
        });
      }
      return [];
    }).filter(Boolean) as { attendancePercentage: number, gpa: number }[];

    if (allSemesters.length === 0) return { chartData: [], xDomain: [50, 100], xTicks: [] };

    const attendancePercentages = allSemesters.map(s => s.attendancePercentage);
    const minAttendance = Math.min(...attendancePercentages);
    const maxAttendance = Math.max(...attendancePercentages);
    const range = maxAttendance - minAttendance;
    const binSize = range > 0 ? range / plotPoints : 1;

    const attendanceBins = new Map<number, { totalGpa: number; totalAttendance: number; count: number }>();

    allSemesters.forEach(semester => {
      let binIndex = 0;
      if (binSize > 0) {
        binIndex = Math.floor((semester.attendancePercentage - minAttendance) / binSize);
        if (binIndex >= plotPoints) {
            binIndex = plotPoints - 1;
        }
      }
      
      if (!attendanceBins.has(binIndex)) {
        attendanceBins.set(binIndex, { totalGpa: 0, totalAttendance: 0, count: 0 });
      }

      const bin = attendanceBins.get(binIndex)!;
      bin.totalGpa += semester.gpa;
      bin.totalAttendance += semester.attendancePercentage;
      bin.count++;
    });

    const data = Array.from(attendanceBins.values())
      .map(({ totalGpa, totalAttendance, count }) => ({
        attendance: totalAttendance / count,
        avgGpa: totalGpa / count,
      }))
      .sort((a, b) => a.attendance - b.attendance);

    const xMin = Math.floor(minAttendance / 10) * 10;
    const xMax = 100;
    const calculatedXDomain: [number, number] = [xMin, xMax];

    const calculatedXTicks = [];
    for (let i = xMin; i <= xMax; i += 5) {
        calculatedXTicks.push(i);
    }

    return { chartData: data, xDomain: calculatedXDomain, xTicks: calculatedXTicks };

  }, [students, plotPoints]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Attendance vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different attendance levels.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    type="number" 
                    dataKey="attendance" 
                    domain={xDomain}
                    ticks={xTicks}
                    allowDecimals={false}
                >
                    <Label value="Attendance Percentage" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis 
                    domain={[0, 4]} 
                    ticks={[0, 1, 2, 3, 4]}
                    allowDecimals={false}
                >
                    <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line type="monotone" dataKey="avgGpa" stroke="var(--color-avgGpa)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
