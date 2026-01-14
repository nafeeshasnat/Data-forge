
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerationParams, Grade } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThreeValueSlider } from "@/components/ui/three-value-slider";
import { defaultGenerationParams, defaultGradeScale, performanceThresholds, thesisBaselineProfiles } from '@/lib/config';
import { GradeScaleSchema } from "@/lib/schemas";
import { TrimDataDialog } from '@/components/app/trim-data-dialog';

interface ParameterSidebarProps {
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
  onTrim: (minCgpa: number, maxCgpa: number, percentage: number) => void;
  isDataPresent: boolean;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({ onGenerate, isGenerating, onTrim, isDataPresent }) => {
  const [params, setParams] = useState<GenerationParams>({
    ...(thesisBaselineProfiles.naturalDistribution ?? defaultGenerationParams),
  });
  const gradeOrder: Grade[] = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];
  const [baselineKey, setBaselineKey] = useState<string>("naturalDistribution");

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

  const handleGradeScaleChange = (grade: Grade, value: string) => {
    const numericValue = Number(value);
    setParams(prev => ({
      ...prev,
      gradeScale: {
        ...(prev.gradeScale ?? defaultGradeScale),
        [grade]: Number.isFinite(numericValue) ? numericValue : 0,
      },
    }));
  };

  const handleGradeScaleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = GradeScaleSchema.safeParse(parsed);
      if (!result.success) {
        return;
      }
      setParams(prev => ({ ...prev, gradeScale: result.data }));
    } catch (error) {
      // Ignore parse errors; keep current scale.
    }
  };

  const handleSeedChange = (value: string) => {
    setParams(prev => ({
      ...prev,
      seed: value.trim() === "" ? undefined : value,
    }));
  };

  const handleThresholdChange = (key: "high" | "mid", value: string) => {
    const numericValue = Number(value);
    setParams(prev => ({
      ...prev,
      analysisPerformanceThresholds: {
        high: prev.analysisPerformanceThresholds?.high ?? performanceThresholds.high,
        mid: prev.analysisPerformanceThresholds?.mid ?? performanceThresholds.mid,
        [key]: Number.isFinite(numericValue) ? numericValue : 0,
      },
    }));
  };

  const applyBaseline = () => {
    const baseline = thesisBaselineProfiles[baselineKey] ?? thesisBaselineProfiles.thesisBaseline;
    setParams({ ...baseline });
    setDistributionPoints([
      baseline.lowPerformanceChance * 100,
      (1 - baseline.highPerformanceChance) * 100,
    ]);
  };

  const handleGenerate = () => {
    console.log('Generation params:', params);
    onGenerate(params);
  };
  
  const lowPercentage = distributionPoints[0];
  const highPercentage = 100 - distributionPoints[1];
  const midPercentage = 100 - lowPercentage - highPercentage;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Data Generation Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Student Population</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label htmlFor="numStudents">Number of Students</Label>
                    <div className="flex items-center gap-2">
                        <Slider id="numStudents" name="numStudents" min={100} max={20000} step={100} value={[params.numStudents]} onValueChange={(v) => setParams(p => ({...p, numStudents: v[0]}))} />
                        <Input type="number" name="numStudents" className="w-24 h-8" value={params.numStudents} onChange={handleInputChange} step={100} max={20000} />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed">Seed (optional)</Label>
                  <Input
                    id="seed"
                    type="text"
                    value={params.seed ?? ""}
                    onChange={(event) => handleSeedChange(event.target.value)}
                    placeholder="e.g. thesis-2025"
                  />
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
                    <Slider min={-1} max={1} step={0.05} value={[params.preGradScoreInfluence]} onValueChange={(v) => setParams(p => ({...p, preGradScoreInfluence: v[0]}))} />
                </div>
                <div className="space-y-2">
                    <Label>Exception Percentage: {params.exceptionPercentage.toFixed(2)}</Label>
                    <Slider min={0} max={1} step={0.05} value={[params.exceptionPercentage]} onValueChange={(v) => setParams(p => ({...p, exceptionPercentage: v[0]}))} />
                </div>
                <div className="space-y-2">
                  <Label>Failing Students (CGPA &lt; 2.0): {(params.failChance ?? 0).toFixed(2)}</Label>
                  <Slider
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={[params.failChance ?? 0]}
                    onValueChange={(v) => setParams(p => ({ ...p, failChance: v[0] }))}
                  />
                </div>
                <div className="space-y-2">
                    <Label>Perfect Scorer Chance: {(params.perfectScorerChance ?? 0.8).toFixed(2)}</Label>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[params.perfectScorerChance ?? 0.8]}
                      onValueChange={(v) => setParams(p => ({ ...p, perfectScorerChance: v[0] }))}
                    />
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
          <AccordionItem value="item-4">
            <AccordionTrigger>Grading Scale</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {gradeOrder.map((grade) => (
                  <div key={grade} className="space-y-2">
                    <Label htmlFor={`grade-${grade}`}>{grade}</Label>
                    <Input
                      id={`grade-${grade}`}
                      type="number"
                      step="0.05"
                      value={(params.gradeScale ?? defaultGradeScale)[grade]}
                      onChange={(event) => handleGradeScaleChange(grade, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="grade-scale-upload">Upload Grade Scale (JSON)</Label>
                <Input
                  id="grade-scale-upload"
                  type="file"
                  accept="application/json"
                  onChange={handleGradeScaleUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setParams(prev => ({ ...prev, gradeScale: defaultGradeScale }))}
                >
                  Reset to Default
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Analysis Performance Groups</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="analysis-high">High Threshold</Label>
                  <Input
                    id="analysis-high"
                    type="number"
                    step="0.05"
                    value={(params.analysisPerformanceThresholds?.high ?? performanceThresholds.high).toFixed(2)}
                    onChange={(event) => handleThresholdChange("high", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysis-mid">Mid Threshold</Label>
                  <Input
                    id="analysis-mid"
                    type="number"
                    step="0.05"
                    value={(params.analysisPerformanceThresholds?.mid ?? performanceThresholds.mid).toFixed(2)}
                    onChange={(event) => handleThresholdChange("mid", event.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setParams(prev => ({ ...prev, analysisPerformanceThresholds: performanceThresholds }))}
              >
                Reset to Default
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex flex-col gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? 'Generating...' : 'Generate Data'}
          </Button>
          <div className="space-y-2">
            <Label htmlFor="baseline-profile">Baseline Profile</Label>
            <select
              id="baseline-profile"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={baselineKey}
              onChange={(event) => setBaselineKey(event.target.value)}
            >
              <option value="thesisBaseline">Thesis Baseline</option>
              <option value="naturalDistribution">Natural Distribution</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={applyBaseline} className="w-full">
            Load Baseline
          </Button>
          <TrimDataDialog onTrim={onTrim} disabled={!isDataPresent} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterSidebar;
