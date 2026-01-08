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

const DENSITY_COLOR_SCALE = [
  '#FFEDA0',
  '#FED976',
  '#FEB24C',
  '#FD8D3C',
  '#FC4E2A',
  '#E31A1C',
  '#BD0026',
  '#800026'
];

const CELL_SIZE = 15;

export function HscVsCgpaDensityChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    const grid: { [key: string]: number } = {};
    let maxDensity = 0;

    students.forEach(s => {
      const x = Math.floor(((s.ssc_gpa + s.hsc_gpa) / 2) / 0.1) * 0.1;
      const y = Math.floor(s.cgpa / 0.1) * 0.1;
      const key = `${x.toFixed(2)}-${y.toFixed(2)}`;

      if (!grid[key]) {
        grid[key] = 0;
      }
      grid[key]++;

      if (grid[key] > maxDensity) {
        maxDensity = grid[key];
      }
    });

    return Object.entries(grid).map(([key, density]) => {
      const [preGradGpa, cgpa] = key.split('-').map(Number);
      const color = DENSITY_COLOR_SCALE[Math.floor((density - 1) * (DENSITY_COLOR_SCALE.length -1) / (maxDensity - 1))];

      return {
        preGradGpa,
        cgpa,
        density,
        color
      };
    });
  }, [students]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Grad GPA vs. University CGPA (Density)</CardTitle>
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
                                <p><strong>Density:</strong> {data.density}</p>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            {chartData.map((data, i) => (
                 <Scatter key={i} name="Students" data={[data]} fill={data.color} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
