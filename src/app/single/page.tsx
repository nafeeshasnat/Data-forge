'use client';

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BotMessageSquare, GitMerge, Scissors, User } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/app/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PerformanceGroup = "High" | "Mid" | "Low";

type SemesterConfig = {
  creditHours: number;
  attendancePercentage: number;
};

const defaultSemesterConfig = (): SemesterConfig => ({
  creditHours: 15,
  attendancePercentage: 80,
});

export default function SingleStudentPage() {
  const location = useLocation();
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup>("Mid");
  const [semesterCount, setSemesterCount] = useState(8);
  const [semesters, setSemesters] = useState<SemesterConfig[]>(
    Array.from({ length: 8 }, defaultSemesterConfig)
  );

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

  const updateSemester = (index: number, updates: Partial<SemesterConfig>) => {
    setSemesters((prev) =>
      prev.map((semester, idx) => (idx === index ? { ...semester, ...updates } : semester))
    );
  };

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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Generate Student</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Generate Student (UI Only)
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
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Semester Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {semesters.map((semester, index) => (
                <div key={`semester-${index}`} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold">Semester {index + 1}</h2>
                    <span className="text-xs text-muted-foreground">
                      Credits: {semester.creditHours} | Attendance: {semester.attendancePercentage}%
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`credits-${index}`}>Credit Hours</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          min={9}
                          max={24}
                          step={1}
                          value={[semester.creditHours]}
                          onValueChange={(value) => updateSemester(index, { creditHours: value[0] })}
                        />
                        <Input
                          id={`credits-${index}`}
                          type="number"
                          className="w-20 h-8"
                          value={semester.creditHours}
                          onChange={(event) => updateSemester(index, { creditHours: Number(event.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`attendance-${index}`}>Attendance %</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          min={50}
                          max={100}
                          step={1}
                          value={[semester.attendancePercentage]}
                          onValueChange={(value) => updateSemester(index, { attendancePercentage: value[0] })}
                        />
                        <Input
                          id={`attendance-${index}`}
                          type="number"
                          className="w-20 h-8"
                          value={semester.attendancePercentage}
                          onChange={(event) => updateSemester(index, { attendancePercentage: Number(event.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
