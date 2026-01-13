'use client';

import type { StudentWithCgpa, GenerationParams } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditLoadVsGradeTableProps {
  students: StudentWithCgpa[];
  params: GenerationParams | null;
}

export function CreditLoadVsGradeTable({ students, params }: CreditLoadVsGradeTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Load vs. Grade (Debug)</CardTitle>
        <CardDescription>
          Debug table for credit load vs. average semester grade data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Credit Load</TableHead>
              <TableHead>Average Impacted GPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.student_id}>
                <TableCell>{student.avgCreditLoad}</TableCell>
                <TableCell>{student.cgpa.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
