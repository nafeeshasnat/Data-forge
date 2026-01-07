'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/app/logo';

interface MergeSidebarProps {
  onMerge: () => void;
  onDownload: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  mergedStudentsCount: number;
}

export function MergeSidebar({ onMerge, onDownload, onFileChange, mergedStudentsCount }: MergeSidebarProps) {
  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-card">
        <div className="flex items-center justify-between">
            <Logo />
            <Link href="/" passHref>
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
          <CardTitle>Trim Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cgpa-range">CGPA Range</Label>
            <Slider id="cgpa-range" defaultValue={[0, 4]} min={0} max={4} step={0.1} />
          </div>
          <div>
            <Label htmlFor="attendance-range">Attendance (%)</Label>
            <Slider id="attendance-range" defaultValue={[0, 100]} min={0} max={100} step={1} />
          </div>
          <div>
            <Label>Department</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cse">CSE</SelectItem>
                <SelectItem value="eee">EEE</SelectItem>
                <SelectItem value="bba">BBA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Apply Trim</Button>
        </CardContent>
      </Card>
    </div>
  );
}
