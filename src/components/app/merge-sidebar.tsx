'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/app/logo';

interface MergeSidebarProps {
  onMerge: () => void;
  onDownload: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onJsonToText: (file: File) => void;
  onTrim: (minCgpa: number, maxCgpa: number, percentage: number) => void;
  mergedStudentsCount: number;
}

export function MergeSidebar({ onMerge, onDownload, onFileChange, onJsonToText, onTrim, mergedStudentsCount }: MergeSidebarProps) {
  const [cgpaRange, setCgpaRange] = React.useState<[number, number]>([2.0, 3.0]);
  const [percentage, setPercentage] = React.useState<number>(10);
  const [jsonFile, setJsonFile] = React.useState<File | null>(null);

  const handleTrimClick = () => {
    onTrim(cgpaRange[0], cgpaRange[1], percentage);
  };

  const handleJsonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setJsonFile(event.target.files[0]);
    }
  };

  const handleJsonToTextClick = () => {
    if (jsonFile) {
      onJsonToText(jsonFile);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-card">
        <div className="flex items-center justify-between">
            <Logo />
            <Link to="/">
              <Button variant="outline">Back to Main</Button>
            </Link>
        </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Merge Datasets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Upload JSON Files</Label>
            <Input id="file-upload" type="file" multiple onChange={onFileChange} accept=".json" />
          </div>
          <Button onClick={onMerge} className="w-full">
            Merge Datasets
          </Button>
          <Button onClick={onDownload} disabled={mergedStudentsCount === 0} className="w-full">
            Download Merged Dataset
          </Button>
        </CardContent>
      </Card>

      <Separator />

       <Card>
        <CardHeader>
          <CardTitle>JSON to Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="json-file-upload">Upload JSON File</Label>
            <Input id="json-file-upload" type="file" onChange={handleJsonFileChange} accept=".json" />
          </div>
          <Button onClick={handleJsonToTextClick} disabled={!jsonFile} className="w-full">
            Convert to Text
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Trim Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <div className="flex justify-between mb-2">
                <Label htmlFor="cgpa-range">CGPA Range</Label>
                <span className="text-sm text-muted-foreground">{cgpaRange[0].toFixed(1)} - {cgpaRange[1].toFixed(1)}</span>
            </div>
            <Slider
              id="cgpa-range"
              value={cgpaRange}
              onValueChange={setCgpaRange}
              min={0}
              max={4}
              step={0.1}
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
                <Label htmlFor="trim-percentage">Removal Percentage</Label>
                 <span className="text-sm text-muted-foreground">{percentage}%</span>
            </div>
            <Input
              id="trim-percentage"
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
              min={0}
              max={100}
            />
          </div>
          <Button onClick={handleTrimClick} disabled={mergedStudentsCount === 0} className="w-full">
            Apply Trim
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
