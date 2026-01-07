'use client';

import * as React from 'react';
import type { StudentWithCgpa } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface DataPreviewProps {
  students: StudentWithCgpa[];
}

export function DataPreview({ students }: DataPreviewProps) {
  const [randomStudents, setRandomStudents] = React.useState<StudentWithCgpa[]>([]);

  React.useEffect(() => {
    if (students.length > 0) {
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      setRandomStudents(shuffled.slice(0, 5)); // Show 5 random students
    }
  }, [students]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {randomStudents.map((student) => (
        <Card key={student.student_id}>
          <CardHeader>
            <CardTitle className="text-base">{student.student_id}</CardTitle>
            <CardDescription>
              {student.department} | {student.gender} | Age: {new Date().getFullYear() - student.birth_year}
            </CardDescription>
            <CardDescription>
              CGPA: {student.cgpa.toFixed(2)} | HSC GPA: {student.hsc_gpa.toFixed(2)} | SSC GPA: {student.ssc_gpa.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Show Semester Details</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(student.semesters).map(([semester, data]) => (
                      <div key={semester} className="rounded-md border p-3">
                        <p className="font-semibold">{`Semester ${semester.replace('semester', '')}`}</p>
                        <p>Credits: {data.creditHours}</p>
                        <p>Attendance: {data.attendancePercentage}%</p>
                        <p className="mt-2 font-medium">Grades:</p>
                        <ul className="list-inside list-disc pl-2">
                          {Object.entries(data).map(([key, value]) => {
                            if (key !== 'creditHours' && key !== 'attendancePercentage') {
                              return <li key={key}>{`${key}: ${value}`}</li>
                            }
                            return null
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
