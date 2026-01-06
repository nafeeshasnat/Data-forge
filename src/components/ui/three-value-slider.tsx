
import * as React from 'react';
import { cn } from "@/lib/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface ThreeValueSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    colors?: [string, string, string];
}

const ThreeValueSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, ThreeValueSliderProps>(
    ({ className, colors = ['#ef4444', '#fde047', '#84cc16'], ...props }, ref) => {
        const { value, max } = props;
        const lowerValue = value?.[0] ?? 0;
        const upperValue = value?.[1] ?? 100;

        return (
            <SliderPrimitive.Root
                ref={ref}
                {...props}
                className={cn("relative flex w-full touch-none select-none items-center", className)}
            >
                <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                    <SliderPrimitive.Range className="absolute h-full" style={{ 
                        left: `${(lowerValue / max!) * 100}%`, 
                        right: `${100 - (upperValue / max!) * 100}%`,
                        backgroundColor: colors[1] 
                    }}/>
                    <div className="absolute h-full" style={{ 
                        width: `${(lowerValue / max!) * 100}%`,
                        backgroundColor: colors[0]
                    }}/>
                    <div className="absolute h-full" style={{ 
                        left: `${(upperValue / max!) * 100}%`,
                        right: 0,
                        backgroundColor: colors[2]
                    }}/>
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
            </SliderPrimitive.Root>
        );
    }
);

ThreeValueSlider.displayName = 'ThreeValueSlider';

export { ThreeValueSlider };
