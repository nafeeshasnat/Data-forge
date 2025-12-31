"use client";

import { DEPARTMENTS, SUBJECTS } from "@/lib/subjects";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SubjectPoolDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Pools</CardTitle>
        <CardDescription>
          Available subjects for each department.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {DEPARTMENTS.map((dept) => (
            <AccordionItem value={dept} key={dept}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span>{dept}</span>
                  <Badge variant="secondary">
                    {SUBJECTS[dept].length} subjects
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground max-h-48 overflow-y-auto">
                  {SUBJECTS[dept].map((subject) => (
                    <li key={subject}>{subject}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
