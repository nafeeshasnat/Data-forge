declare module "react-day-picker" {
  import * as React from "react";

  export type DayPickerProps = React.ComponentProps<"div"> & {
    showOutsideDays?: boolean;
    classNames?: Record<string, string>;
    components?: {
      IconLeft?: React.ComponentType<any>;
      IconRight?: React.ComponentType<any>;
    };
  };

  export const DayPicker: React.ComponentType<DayPickerProps>;
}
