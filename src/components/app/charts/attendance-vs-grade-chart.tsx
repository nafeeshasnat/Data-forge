'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Student, Grade } from '@/lib/types';

const GRADE_SCALE: Record<Grade, number> = {
    'A+': 4.0,
    A: 3.75,
    'A-': 3.5,
    'B+': 3.25,
    B: 3.0,
    'B-': 2.75,
    'C+': 2.5,
    C: 2.25,
    D: 2.0,
    F: 0.0,
};

interface AttendanceVsGradeChartProps {
  students: Student[];
}

export function AttendanceVsGradeChart({ students }: AttendanceVsGradeChartProps) {
  const data = useMemo(() => {
    const attendanceData: { [key: number]: { totalGpa: number; count: number } } = {};

    students.forEach(student => {
      Object.values(student.semesters).forEach(semester => {
        let totalGradePoints = 0;
        let subjectCount = 0;

        Object.entries(semester).forEach(([key, value]) => {
          if (key !== 'creditHours' && key !== 'attendancePercentage') {
            totalGradePoints += GRADE_SCALE[value as Grade] || 0;
            subjectCount++;
          }
        });

        if (subjectCount > 0) {
          const gpa = totalGradePoints / subjectCount;
          const attendance = semester.attendancePercentage;
          
          if (!attendanceData[attendance]) {
            attendanceData[attendance] = { totalGpa: 0, count: 0 };
          }
          attendanceData[attendance].totalGpa += gpa;
          attendanceData[attendance].count++;
        }
      });
    });

    return Object.entries(attendanceData).map(([attendance, { totalGpa, count }]) => ({
        attendance: parseInt(attendance),
        avgGpa: totalGpa / count,
      })).sort((a, b) => a.attendance - b.attendance);

  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Attendance vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different attendance percentages.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="attendance" unit="%" domain={['dataMin', 'dataMax']}>
              <Label value="Attendance Percentage" offset={-15} position="insideBottom" />
            </XAxis>
            <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tickFormatter={(tick) => tick.toFixed(2)}>
                <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="avgGpa" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-bold">{`Attendance: ${label}%`}</p>
          <p className="text-sm text-muted-foreground">{`Avg. GPA: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
  
    return null;
  };