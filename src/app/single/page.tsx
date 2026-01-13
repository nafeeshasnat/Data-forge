'use client';

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, BotMessageSquare, GitMerge, Scissors, User } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/app/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { defaultGenerationParams } from "@/lib/config";
import { generateSingleStudent } from "@/lib/data-generator";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

type PerformanceGroup = "High" | "Mid" | "Low";

type SemesterConfig = {
  creditHours: number;
  attendancePercentage: number;
  gpa: number;
};

const defaultSemesterConfig = (): SemesterConfig => ({
  creditHours: defaultGenerationParams.stdCredit,
  attendancePercentage: 80,
  gpa: 3.0,
});

export default function SingleStudentPage() {
  const location = useLocation();
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup>("Mid");
  const [semesterCount, setSemesterCount] = useState(8);
  const [averageCredits, setAverageCredits] = useState(defaultGenerationParams.stdCredit);
  const [maxCreditImpact, setMaxCreditImpact] = useState(defaultGenerationParams.maxCreditImpact);
  const [attendanceImpact, setAttendanceImpact] = useState(defaultGenerationParams.attendanceImpact);
  const [semesters, setSemesters] = useState<SemesterConfig[]>(
    Array.from({ length: 8 }, defaultSemesterConfig)
  );
  const [studentData, setStudentData] = useState<ReturnType<typeof generateSingleStudent>["student"] | null>(null);

  useEffect(() => {
    setSemesters((prev) => {
      const next = [...prev];
      if (semesterCount > next.length) {
        for (let i = next.length; i < semesterCount; i += 1) {
          next.push(defaultSemesterConfig());
        }
      } else if (semesterCount < next.length) {
        next.length = semesterCount;
      }
      return next;
    });
  }, [semesterCount]);

  const runGeneration = () => {
    const { student, semesterSummaries } = generateSingleStudent(
      {
        ...defaultGenerationParams,
        attendanceImpact,
        maxCreditImpact,
      },
      {
        performanceGroup,
        semesterCount,
        averageCredits,
        attendanceImpact,
        maxCreditImpact,
      }
    );
    setStudentData(student);
    setSemesters(semesterSummaries);
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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 md:w-96 md:border-r">
        <SidebarHeader className="border-b p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  min={defaultGenerationParams.minCredit}
                  max={defaultGenerationParams.maxCredit}
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
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">Single Student</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <Button asChild variant={isActive("/") ? "secondary" : "ghost"} size="icon" aria-label="Go to Generate" title="Generate">
              <Link to="/" aria-current={isActive("/") ? "page" : undefined}>
                <BotMessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant={isActive("/single") ? "secondary" : "ghost"} size="icon" aria-label="Go to Single Student" title="Single Student">
              <Link to="/single" aria-current={isActive("/single") ? "page" : undefined}>
                <User className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant={isActive("/trim") ? "secondary" : "ghost"} size="icon" aria-label="Go to Trim" title="Trim">
              <Link to="/trim" aria-current={isActive("/trim") ? "page" : undefined}>
                <Scissors className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant={isActive("/merge") ? "secondary" : "ghost"} size="icon" aria-label="Go to Merge" title="Merge">
              <Link to="/merge" aria-current={isActive("/merge") ? "page" : undefined}>
                <GitMerge className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant={isActive("/analysis") ? "secondary" : "ghost"} size="icon" aria-label="Go to Analysis" title="Analysis">
              <Link to="/analysis" aria-current={isActive("/analysis") ? "page" : undefined}>
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>GPA Trend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gpaTrendData}>
                    <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 4]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Credits vs CGPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                      <XAxis type="number" dataKey="credits" name="Credits" />
                      <YAxis type="number" dataKey="gpa" name="CGPA" domain={[0, 4]} />
                      <Tooltip />
                      <ReferenceLine x={averageCredits} stroke="#dc2626" strokeDasharray="2 4" />
                      <Scatter data={creditLoadData} fill="#dc2626" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attendance & Grade Change Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Tooltip />
                      <Line
                        yAxisId="attendance"
                        type="monotone"
                        dataKey="attendance"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        yAxisId="grade"
                        type="monotone"
                        dataKey="gradeChangeRate"
                        stroke="#a78bfa"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
