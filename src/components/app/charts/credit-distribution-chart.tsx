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

export function CreditDistributionChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    const creditCounts: Record<string, number> = {};

    students.forEach(student => {
        Object.values(student.semesters).forEach(semester => {
            const credits = semester.creditHours;
            creditCounts[credits] = (creditCounts[credits] || 0) + 1;
        })
    });

    return Object.entries(creditCounts)
      .map(([creditCount, studentCount]) => ({
        name: `${creditCount} Credits`,
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
      label: "Semesters",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Hour Distribution</CardTitle>
        <CardDescription>
          Number of semesters by credit hours taken.
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
