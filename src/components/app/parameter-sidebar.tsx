
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerationParams } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThreeValueSlider } from "@/components/ui/three-value-slider";
import { defaultParams } from '@/lib/config';
import { TrimDataDialog } from '@/components/app/trim-data-dialog';

interface ParameterSidebarProps {
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
  onTrim: (minCgpa: number, maxCgpa: number, percentage: number) => void;
  isDataPresent: boolean;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({ onGenerate, isGenerating, onTrim, isDataPresent }) => {
  const [params, setParams] = useState<GenerationParams>({
    numStudents: defaultParams.studentCount,
    creditsPerSubject: 3,
    minCredit: defaultParams.minCredits,
    stdCredit: defaultParams.initialCredits,
    maxCredit: defaultParams.maxCredits,
    maxCreditImpact: defaultParams.maxCreditImpact,
    highPerformanceChance: 0.2,
    lowPerformanceChance: 0.1,
    preGradScoreInfluence: 0.2,
    exceptionPercentage: 0.1,
    attendanceImpact: defaultParams.attendanceImpact,
  });

  const [distributionPoints, setDistributionPoints] = useState([params.lowPerformanceChance * 100, (1 - params.highPerformanceChance) * 100]);

  useEffect(() => {
    const lowChance = distributionPoints[0] / 100;
    const highChance = 1 - (distributionPoints[1] / 100);
    setParams(prevParams => ({ ...prevParams, highPerformanceChance: highChance, lowPerformanceChance: lowChance }));
  }, [distributionPoints]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({...prev, [name]: parseFloat(value)}));
  };
  
  const lowPercentage = distributionPoints[0];
  const highPercentage = 100 - distributionPoints[1];
  const midPercentage = 100 - lowPercentage - highPercentage;

  return (
    <Card className="h-full flex flex-col w-96">
      <CardHeader>
        <CardTitle>Data Generation Parameters</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Student Population</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label htmlFor="numStudents">Number of Students</Label>
                    <div className="flex items-center gap-2">
                        <Slider id="numStudents" name="numStudents" min={100} max={5000} step={100} value={[params.numStudents]} onValueChange={(v) => setParams(p => ({...p, numStudents: v[0]}))} />
                        <Input type="number" name="numStudents" className="w-24 h-8" value={params.numStudents} onChange={handleInputChange} step={100}/>
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Performance Distribution</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <ThreeValueSlider
                    min={0} max={100} step={1} value={distributionPoints} onValueChange={(v) => setDistributionPoints(v as number[])} 
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Low: {lowPercentage.toFixed(0)}%</span>
                    <span>Mid: {midPercentage.toFixed(0)}%</span>
                    <span>High: {highPercentage.toFixed(0)}%</span>
                </div>
                <div className="space-y-2">
                    <Label>Pre-Grad Score Influence: {params.preGradScoreInfluence.toFixed(2)}</Label>
                    <Slider min={0} max={1} step={0.05} value={[params.preGradScoreInfluence]} onValueChange={(v) => setParams(p => ({...p, preGradScoreInfluence: v[0]}))} />
                </div>
                <div className="space-y-2">
                    <Label>Exception Percentage: {params.exceptionPercentage.toFixed(2)}</Label>
                    <Slider min={0} max={1} step={0.05} value={[params.exceptionPercentage]} onValueChange={(v) => setParams(p => ({...p, exceptionPercentage: v[0]}))} />
                </div>
                <div className="space-y-2">
                  <Label>Attendance Impact: {params.attendanceImpact.toFixed(2)}</Label>
                  <Slider min={0} max={0.5} step={0.05} value={[params.attendanceImpact]} onValueChange={(v) => setParams(p => ({...p, attendanceImpact: v[0]}))} />
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Credit & Course Load</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                    <div className="space-y-2 w-1/2">
                        <Label htmlFor="stdCredit">Standard Credits</Label>
                        <Input type="number" name="stdCredit" value={params.stdCredit} onChange={handleInputChange}/>
                    </div>
                    <div className="space-y-2 w-1/2">
                        <Label htmlFor="creditsPerSubject">Credits/Subject</Label>
                        <Input type="number" name="creditsPerSubject" value={params.creditsPerSubject} onChange={handleInputChange}/>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Credit Load Impact: {params.maxCreditImpact.toFixed(2)}</Label>
                    <Slider min={0} max={0.5} step={0.01} value={[params.maxCreditImpact]} onValueChange={(v) => setParams(p => ({...p, maxCreditImpact: v[0]}))} />
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onGenerate(params)} disabled={isGenerating} className="w-full">
            {isGenerating ? 'Generating...' : 'Generate Data'}
          </Button>
          <TrimDataDialog onTrim={onTrim} disabled={!isDataPresent} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterSidebar;
