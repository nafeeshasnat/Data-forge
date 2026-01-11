'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MergeSidebarProps {
    onMerge: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    mergedStudentsCount: number;
    downloadPath: string | null;
    downloadFilename: string | null;
    analysisThresholds: { high: number; mid: number };
    onAnalysisThresholdsChange: (thresholds: { high: number; mid: number }) => void;
    isLoading?: boolean;
}

export function MergeSidebar({ 
    onMerge, 
    onFileChange, 
    mergedStudentsCount, 
    downloadPath,
    downloadFilename,
    analysisThresholds,
    onAnalysisThresholdsChange,
    isLoading = false 
}: MergeSidebarProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Datasets</CardTitle>
                    <CardDescription>Select one or more JSON files to merge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="json-files">JSON Files</Label>
                        <Input id="json-files" type="file" multiple onChange={onFileChange} accept=".json" disabled={isLoading} />
                    </div>
                    <Button onClick={onMerge} className="w-full" disabled={isLoading}>
                        Merge Datasets
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dataset Structure</CardTitle>
                    <CardDescription>Review the expected JSON structure before merging.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                Show Structure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                                <DialogTitle>Student Dataset Structure</DialogTitle>
                                <DialogDescription>
                                    Each file should contain an array of student records with semester data.
                                </DialogDescription>
                            </DialogHeader>
                            <pre className="rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
{`[
  {
    "student_id": 123456,
    "ssc_gpa": 4.5,
    "hsc_gpa": 4.2,
    "gender": "female",
    "birth_year": 2003,
    "department": "CSE",
    "semesters": {
      "1": {
        "creditHours": 15,
        "attendancePercentage": 85,
        "Introduction to Programming": "A"
      }
    }
  }
]`}
                            </pre>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Analysis Performance Groups</CardTitle>
                    <CardDescription>Adjust analysis-only thresholds for High and Mid groups.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="merge-analysis-high">High Threshold</Label>
                        <Input
                            id="merge-analysis-high"
                            type="number"
                            step="0.05"
                            value={analysisThresholds.high.toFixed(2)}
                            onChange={(event) =>
                                onAnalysisThresholdsChange({
                                    ...analysisThresholds,
                                    high: Number(event.target.value),
                                })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="merge-analysis-mid">Mid Threshold</Label>
                        <Input
                            id="merge-analysis-mid"
                            type="number"
                            step="0.05"
                            value={analysisThresholds.mid.toFixed(2)}
                            onChange={(event) =>
                                onAnalysisThresholdsChange({
                                    ...analysisThresholds,
                                    mid: Number(event.target.value),
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Download Merged Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" disabled={isLoading || !downloadPath} className="w-full">
                        <a href={downloadPath || undefined} download={downloadFilename || undefined}>
                            Download JSON
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
