"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion, useMotionValue, useTransform } from "framer-motion";

export interface NumberTickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  startValue?: number;
}

export const NumberTicker = React.forwardRef<HTMLDivElement, NumberTickerProps>(
  (
    {
      value = 0,
      decimalPlaces = 0,
      startValue = 0,
      className,
      ...props
    },
    ref
  ) => {
    const motionValue = useMotionValue(startValue);

    React.useEffect(() => {
      motionValue.set(value);
    }, [motionValue, value]);

    const displayValue = useTransform(motionValue, (current) =>
      current.toFixed(decimalPlaces)
    );

    return (
      <motion.div
        ref={ref}
        className={cn("font-mono", className)}
        {...props}
      >
        {displayValue}
      </motion.div>
    );
  }
);

NumberTicker.displayName = "NumberTicker";
