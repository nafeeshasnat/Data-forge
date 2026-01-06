
import type { GenerationParams } from "@/lib/types";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Logo } from "@/components/app/logo";
import { Download, LoaderCircle, RefreshCw, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ParameterSidebarProps {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  onDownload: () => void;
  isLoading: boolean;
}

export function ParameterSidebar({
  params,
  setParams,
  onGenerate,
  onDownload,
  isLoading,
}: ParameterSidebarProps) {
  const handleParamChange =
    (key: keyof GenerationParams) => (value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setParams((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSliderChange =
    (key: keyof GenerationParams) => (values: number[]) => {
      handleParamChange(key)(values[0]);
    };

  return (
    <>
      <SidebarHeader className="border-b">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-0">
         <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/upload">
                  <Upload />
                  <span>Upload Dataset</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        <Separator/>
        <SidebarGroup>
          <SidebarGroupLabel>Dataset Size</SidebarGroupLabel>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <Label htmlFor="numStudents">Number of Students</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="numStudents"
                  name="numStudents"
                  min={10}
                  max={1000}
                  step={10}
                  value={[params.numStudents]}
                  onValueChange={handleSliderChange("numStudents")}
                />
                <Input
                  type="number"
                  name="numStudents"
                  className="w-20 h-8"
                  value={params.numStudents}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Semester Workload</SidebarGroupLabel>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <Label>Credit Range Per Semester</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Min: {params.minCredit}, Std: {params.stdCredit}, Max: {params.maxCredit}
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="maxCreditImpact">Max GPA Impact from Workload</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="maxCreditImpact"
                  name="maxCreditImpact"
                  min={0.01}
                  max={0.25}
                  step={0.01}
                  value={[params.maxCreditImpact]}
                  onValueChange={handleSliderChange("maxCreditImpact")}
                />
                <Input
                  type="number"
                  name="maxCreditImpact"
                  className="w-20 h-8"
                  value={params.maxCreditImpact}
                  onChange={handleInputChange}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        </SidebarGroup>
        <Separator />
         <SidebarGroup>
          <SidebarGroupLabel>Performance Distribution</SidebarGroupLabel>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <Label htmlFor="highPerformanceChance">High-Performer Chance (%)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="highPerformanceChance"
                  name="highPerformanceChance"
                  min={0.01} max={1} step={0.01}
                  value={[params.highPerformanceChance]}
                  onValueChange={handleSliderChange("highPerformanceChance")}
                />
                <Input
                  type="number"
                  name="highPerformanceChance"
                  className="w-20 h-8"
                  value={params.highPerformanceChance}
                  onChange={handleInputChange}
                  step={0.01}
                />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="failChance">Failure-Prone Chance (%)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="failChance"
                  name="failChance"
                  min={0.01} max={1} step={0.01}
                  value={[params.failChance]}
                  onValueChange={handleSliderChange("failChance")}
                />
                <Input
                  type="number"
                  name="failChance"
                  className="w-20 h-8"
                  value={params.failChance}
                  onChange={handleInputChange}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex flex-col gap-2">
          <Button onClick={onGenerate} disabled={isLoading}>
            {isLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            <span>{isLoading ? "Generating..." : "Generate Data"}</span>
          </Button>
          <Button variant="outline" onClick={onDownload} disabled={isLoading}>
            <Download />
            <span>Download JSON</span>
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
