
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ThreeValueSlider } from "@/components/ui/three-value-slider";

interface TrimDataDialogProps {
  onTrim: (minCgpa: number, maxCgpa: number, percentage: number) => void;
  disabled?: boolean;
}

export const TrimDataDialog: React.FC<TrimDataDialogProps> = ({ onTrim, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cgpaRange, setCgpaRange] = useState([2.0, 3.0]);
  const [percentage, setPercentage] = useState(10);

  const handleTrimClick = () => {
    onTrim(cgpaRange[0], cgpaRange[1], percentage);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>Trim Data</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trim Dataset</DialogTitle>
          <DialogDescription>
            Select a CGPA range and a percentage of students to remove from that range.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>CGPA Range: {cgpaRange[0].toFixed(2)} - {cgpaRange[1].toFixed(2)}</Label>
            <ThreeValueSlider
              min={0}
              max={4}
              step={0.1}
              value={cgpaRange}
              onValueChange={(value) => {
                if (Array.isArray(value)) {
                  setCgpaRange(value);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Percentage to Remove: {percentage}%</Label>
            <Slider min={0} max={100} step={1} value={[percentage]} onValueChange={(v) => setPercentage(v[0])} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleTrimClick}>Trim Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
