'use client';

import * as React from 'react';
import { Scatter, ScatterChart, XAxis, YAxis, Tooltip, CartesianGrid, Label, ResponsiveContainer } from 'recharts';
import type { StudentWithCgpa } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export function HscVsCgpaChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    return students.map(s => ({
      preGradGpa: (s.ssc_gpa + s.hsc_gpa) / 2,
      ssc_gpa: s.ssc_gpa,
      hsc_gpa: s.hsc_gpa,
      cgpa: s.cgpa,
    }));
  }, [students]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Grad GPA vs. University CGPA</CardTitle>
        <CardDescription>
          Shows the correlation between high school and university results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="preGradGpa" name="Pre-Grad GPA" domain={['dataMin - 0.1', 'dataMax + 0.1']} tickFormatter={(tick) => tick.toFixed(2)}>
                <Label value="Pre-Grad GPA" offset={-15} position="insideBottom" />
            </XAxis>
            <YAxis type="number" dataKey="cgpa" name="CGPA" domain={[0, 4]} tickFormatter={(tick) => tick.toFixed(2)}>
                <Label value="CGPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-background border p-2 rounded-md shadow-lg">
                                <p><strong>CGPA:</strong> {data.cgpa.toFixed(2)}</p>
                                <p><strong>Pre-Grad GPA:</strong> {data.preGradGpa.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">SSC: {data.ssc_gpa.toFixed(2)}, HSC: {data.hsc_gpa.toFixed(2)}</p>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            <Scatter name="Students" data={chartData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
