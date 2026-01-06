'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
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

interface CreditLoadVsGradeChartProps {
  students: Student[];
}

export function CreditLoadVsGradeChart({ students }: CreditLoadVsGradeChartProps) {
  const data = useMemo(() => {
    const creditLoadData: { [key: number]: { totalGpa: number; count: number } } = {};

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
          const creditLoad = semester.creditHours;
          if (!creditLoadData[creditLoad]) {
            creditLoadData[creditLoad] = { totalGpa: 0, count: 0 };
          }
          creditLoadData[creditLoad].totalGpa += gpa;
          creditLoadData[creditLoad].count++;
        }
      });
    });

    return Object.entries(creditLoadData).map(([creditLoad, { totalGpa, count }]) => ({
      creditLoad: parseInt(creditLoad),
      avgGpa: totalGpa / count,
    })).sort((a, b) => a.creditLoad - b.creditLoad);

  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Credit Load vs. Average Semester Grade</CardTitle>
        <CardDescription>
          Average GPA for different semester credit loads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="creditLoad" unit=" credits">
                <Label value="Credit Load (per semester)" offset={-20} position="insideBottom" />
            </XAxis>
            <YAxis domain={[0, 4]}>
                <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgGpa" fill="#22c55e" name="Average GPA" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-bold">{`Credit Load: ${label}`}</p>
          <p className="text-sm text-muted-foreground">{`Avg. GPA: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
  
    return null;
  };