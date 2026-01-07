
import * as React from "react";
import { Slider } from "@/components/ui/slider";

interface ThreeValueSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const ThreeValueSlider: React.FC<ThreeValueSliderProps> = ({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1 
}) => {
  const [sliderValues, setSliderValues] = React.useState(value);

  React.useEffect(() => {
    setSliderValues(value);
  }, [value]);

  const handleValueChange = (newValues: number[]) => {
    // Ensure the second value is always greater than or equal to the first
    if (newValues[0] > newValues[1]) {
      newValues = [newValues[1], newValues[0]];
    }
    setSliderValues(newValues);
    onValueChange(newValues);
  };

  return (
    <Slider
      min={min}
      max={max}
      step={step}
      value={sliderValues}
      onValueChange={handleValueChange}
      className="w-full"
    />
  );
};
