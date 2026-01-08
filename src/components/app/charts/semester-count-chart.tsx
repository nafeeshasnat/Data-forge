"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { StudentWithCgpa } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function SemesterCountChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    const semesterCounts: Record<string, number> = {};

    students.forEach(student => {
      const count = student.semesters && Array.isArray(student.semesters) ? student.semesters.length : 0;
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
  }, [students]);

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semester Count Distribution</CardTitle>
        <CardDescription>
          Number of students by total semesters completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.split(' ')[0]}
            />
            <YAxis />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
