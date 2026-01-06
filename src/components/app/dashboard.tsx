"use client";

import type { GenerationResult, GenerationParams } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AiInsights } from "@/components/app/ai-insights";
import { AcademicPerformance } from "@/components/app/academic-performance";
import { DataPreview } from "@/components/app/data-preview";

interface DashboardProps {
  result: GenerationResult;
  isLoading: boolean;
  params: GenerationParams;
}

const StatCard = ({ title, value, description }: { title: string; value: string | number; description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const LoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                </CardContent>
            </Card>
        ))}
        <Card className="col-span-full">
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[400px] w-full" />
            </CardContent>
        </Card>
    </div>
);


export function Dashboard({ result, isLoading, params }: DashboardProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (!result) return null;

  const { summary, insights, data } = result;

  return (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Students" value={summary.totalStudents} description="Number of students in the dataset" />
            <StatCard title="Avg. CGPA" value={summary.avgCgpa} description="Across all departments and years" />
            <StatCard title="Avg. HSC GPA" value={summary.avgHscGpa} description="From the initial student profiles" />
            <AiInsights insights={insights} isLoading={isLoading} />
        </div>
      
        <section>
            <h2 className="text-2xl font-bold mb-4">Academic Performance</h2>
            <AcademicPerformance students={data} summary={summary} params={params} />
        </section>

        <section>
            <h2 className="text-2xl font-bold mb-4">Dataset Preview</h2>
            <DataPreview students={data} />
        </section>
    </div>
  );
}
