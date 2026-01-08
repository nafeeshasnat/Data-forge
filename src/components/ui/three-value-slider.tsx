'use client';

import 'rc-slider/assets/index.css';
import '@/components/app/slider-styles.css';
import Slider from 'rc-slider';

interface ThreeValueSliderProps {
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number | number[]) => void;
}

export const ThreeValueSlider: React.FC<ThreeValueSliderProps> = ({ min, max, step, value, onValueChange }) => {
  return (
    <div className="slider-container">
      <Slider
        range
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onValueChange}
        allowCross={false}
      />
    </div>
  );
};
