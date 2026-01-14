'use client';

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultGenerationParams, thesisBaselineProfiles } from "@/lib/config";
import type { Student } from "@/lib/types";
import { CartesianGrid, Line, LineChart, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app/app-shell";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type PerformanceGroup = "High" | "Mid" | "Low";

type SemesterConfig = {
  creditHours: number;
  attendancePercentage: number;
  gpa: number;
};

const gpaTrendConfig = {
  gpa: {
    label: "GPA",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const creditLoadConfig = {
  gpa: {
    label: "CGPA",
    color: "#dc2626",
  },
} satisfies ChartConfig;

const attendanceConfig = {
  attendance: {
    label: "Attendance %",
    color: "#7c3aed",
  },
  gradeChangeRate: {
    label: "Grade Change %",
    color: "#a78bfa",
  },
} satisfies ChartConfig;

const buildSemesterConfig = (creditHours: number): SemesterConfig => ({
  creditHours,
  attendancePercentage: 80,
  gpa: 3.0,
});

export default function SingleStudentPage() {
  const location = useLocation();
  const initialBaseline = thesisBaselineProfiles.naturalDistribution ?? defaultGenerationParams;
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup>("Mid");
  const [baselineKey, setBaselineKey] = useState<string>("naturalDistribution");
  const [generationParams, setGenerationParams] = useState(initialBaseline);
  const [seed, setSeed] = useState("");
  const [semesterCount, setSemesterCount] = useState(8);
  const [averageCredits, setAverageCredits] = useState(initialBaseline.stdCredit);
  const [maxCreditImpact, setMaxCreditImpact] = useState(initialBaseline.maxCreditImpact);
  const [attendanceImpact, setAttendanceImpact] = useState(initialBaseline.attendanceImpact);
  const [semesters, setSemesters] = useState<SemesterConfig[]>(
    Array.from({ length: 8 }, () => buildSemesterConfig(initialBaseline.stdCredit))
  );
  const [studentData, setStudentData] = useState<Student | null>(null);

  useEffect(() => {
    setSemesters((prev) => {
      const next = [...prev];
      if (semesterCount > next.length) {
        for (let i = next.length; i < semesterCount; i += 1) {
          next.push(buildSemesterConfig(generationParams.stdCredit));
        }
      } else if (semesterCount < next.length) {
        next.length = semesterCount;
      }
      return next;
    });
  }, [semesterCount]);

  const applyBaseline = () => {
    const baseline = thesisBaselineProfiles[baselineKey] ?? defaultGenerationParams;
    setGenerationParams(baseline);
    setAverageCredits(baseline.stdCredit);
    setMaxCreditImpact(baseline.maxCreditImpact);
    setAttendanceImpact(baseline.attendanceImpact);
  };

  const runGeneration = async () => {
    const trimmedSeed = seed.trim();
    const response = await fetch('/api/generate-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: {
          ...generationParams,
          attendanceImpact,
          maxCreditImpact,
          ...(trimmedSeed ? { seed: trimmedSeed } : {}),
        },
        options: {
          performanceGroup,
          semesterCount,
          averageCredits,
          attendanceImpact,
          maxCreditImpact,
        },
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setStudentData(payload?.student ?? null);
    setSemesters(payload?.semesterSummaries ?? []);
  };

  const handleDownload = () => {
    if (!studentData) return;
    const blob = new Blob([JSON.stringify(studentData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const groupLabel = performanceGroup.toLowerCase();
    link.download = `student_${groupLabel}_${studentData.student_id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const gpaTrendData = useMemo(
    () =>
      semesters.map((semester, index) => ({
        name: `Sem ${index + 1}`,
        gpa: semester.gpa,
      })),
    [semesters]
  );

  const creditLoadData = useMemo(
    () =>
      semesters.map((semester, index) => ({
        semester: index + 1,
        credits: semester.creditHours,
        gpa: semester.gpa,
      })),
    [semesters]
  );

  const attendanceData = useMemo(
    () =>
      semesters.map((semester, index) => {
        const prevGpa = index > 0 ? semesters[index - 1].gpa : semester.gpa;
        const gradeChangePercent = ((semester.gpa - prevGpa) / 4) * 100;
        return {
          name: `Sem ${index + 1}`,
          attendance: semester.attendancePercentage,
          gradeChangeRate: Number(gradeChangePercent.toFixed(2)),
        };
      }),
    [semesters]
  );

  return (
    <AppShell
      title="Single Student"
      icon={<User className="h-4 w-4 text-primary" />}
      pathname={location.pathname}
      sidebar={(
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseline-profile">Baseline Profile</Label>
                <select
                  id="baseline-profile"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={baselineKey}
                  onChange={(event) => setBaselineKey(event.target.value)}
                >
                  <option value="thesisBaseline">Thesis Baseline</option>
                  <option value="naturalDistribution">Natural Distribution</option>
                </select>
                <Button type="button" variant="outline" onClick={applyBaseline} className="w-full">
                  Load Baseline
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Performance Group</Label>
                <RadioGroup
                  value={performanceGroup}
                  onValueChange={(value) => setPerformanceGroup(value as PerformanceGroup)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(["High", "Mid", "Low"] as PerformanceGroup[]).map((group) => (
                    <div key={group} className="flex items-center gap-2 rounded-md border p-2">
                      <RadioGroupItem value={group} id={`group-${group}`} />
                      <Label htmlFor={`group-${group}`}>{group}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional)</Label>
                <Input
                  id="seed"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder="e.g. run-2024-09-21"
                />
              </div>
              <div className="space-y-2">
                <Label>Semesters: {semesterCount}</Label>
                <Slider
                  min={2}
                  max={12}
                  step={1}
                  value={[semesterCount]}
                  onValueChange={(value) => setSemesterCount(value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label>Average Credits: {averageCredits}</Label>
                <Slider
                  min={generationParams.minCredit}
                  max={generationParams.maxCredit}
                  step={1}
                  value={[averageCredits]}
                  onValueChange={(value) => setAverageCredits(value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Load Impact: {maxCreditImpact.toFixed(2)}</Label>
                <Slider
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={[maxCreditImpact]}
                  onValueChange={(value) => setMaxCreditImpact(value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label>Attendance Impact: {attendanceImpact.toFixed(2)}</Label>
                <Slider
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={[attendanceImpact]}
                  onValueChange={(value) => setAttendanceImpact(value[0])}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Generate Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={runGeneration}>
                Generate Student
              </Button>
              <Button className="w-full" variant="secondary" onClick={handleDownload} disabled={!studentData}>
                Download Student Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>GPA Trend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartContainer config={gpaTrendConfig} className="h-72 w-full">
            <LineChart data={gpaTrendData}>
              <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 4]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line type="monotone" dataKey="gpa" stroke="var(--color-gpa)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credits vs CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={creditLoadConfig} className="h-64 w-full">
              <ScatterChart>
                <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="credits" name="Credits" />
                <YAxis type="number" dataKey="gpa" name="CGPA" domain={[0, 4]} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ReferenceLine x={averageCredits} stroke="var(--color-gpa)" strokeDasharray="2 4" />
                <Scatter data={creditLoadData} fill="var(--color-gpa)" />
              </ScatterChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance & Grade Change Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={attendanceConfig} className="h-64 w-full">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" />
                <YAxis
                  yAxisId="attendance"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  yAxisId="grade"
                  orientation="right"
                  domain={["dataMin - 50", "dataMax + 50"]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line
                  yAxisId="attendance"
                  type="monotone"
                  dataKey="attendance"
                  stroke="var(--color-attendance)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="grade"
                  type="monotone"
                  dataKey="gradeChangeRate"
                  stroke="var(--color-gradeChangeRate)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
