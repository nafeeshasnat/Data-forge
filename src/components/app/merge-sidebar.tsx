'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

interface MergeSidebarProps {
    onMerge: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onJsonToText: (file: File) => void;
    onTrim: (minCgpa: number, maxCgpa: number, percentage: number) => void; 
    mergedStudentsCount: number;
    downloadPath: string | null;
    isLoading?: boolean;
}

export function MergeSidebar({ 
    onMerge, 
    onFileChange, 
    onJsonToText, 
    onTrim, 
    mergedStudentsCount, 
    downloadPath,
    isLoading = false 
}: MergeSidebarProps) {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const { toast } = useToast();

    const handleFileSelectForTextConversion = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleConvert = () => {
        if (selectedFile) {
            onJsonToText(selectedFile);
        } else {
            toast({
                variant: 'destructive',
                title: 'No file selected',
                description: 'Please select a file to convert to text.'
            });
        }
    };

    return (
        <div className="p-4 space-y-4">
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
                    <CardTitle>Convert to Text</CardTitle>
                    <CardDescription>Select a single JSON file to convert to plain text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="json-file-text">JSON File</Label>
                        <Input id="json-file-text" type="file" onChange={handleFileSelectForTextConversion} accept=".json" disabled={isLoading} />
                    </div>
                    <Button onClick={handleConvert} className="w-full" disabled={isLoading}>
                        Convert to Text
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Download Merged Data</CardTitle>
                    <CardDescription>Download the merged dataset as a single JSON file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild disabled={isLoading || !downloadPath} className="w-full">
                        <a href={downloadPath || undefined} download="merged_dataset.json">
                            Download as JSON
                        </a>
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                        {mergedStudentsCount > 0
                            ? `${mergedStudentsCount} students processed.`
                            : "Merge datasets to enable download."}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
