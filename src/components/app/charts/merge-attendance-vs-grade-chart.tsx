import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Label } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface MergeAttendanceVsGradeChartProps {
  data: { attendance: number; avgGpa: number }[];
}

const chartConfig = {
  avgGpa: {
    label: "Avg. GPA",
    color: "hsl(var(--chart-1))",
  },
};

export function MergeAttendanceVsGradeChart({ data }: MergeAttendanceVsGradeChartProps) {
    const { xDomain, xTicks } = useMemo(() => {
        if (!data || data.length === 0) {
            const defaultTicks = Array.from({ length: 21 }, (_, i) => i * 5); // 0, 5, ..., 100
            return { xDomain: [0, 100], xTicks: defaultTicks };
        }
        const minAttendance = Math.min(...data.map(d => d.attendance));
        const domainMin = Math.floor(minAttendance / 10) * 10;
        
        const ticks = [];
        for (let i = domainMin; i <= 100; i += 5) {
            ticks.push(i);
        }
        return { xDomain: [domainMin, 100], xTicks: ticks };
    }, [data]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Attendance vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different attendance levels.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
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
            <Line type="monotone" dataKey="avgGpa" stroke="var(--color-avgGpa)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
