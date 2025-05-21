"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion, useMotionValue, useTransform } from "framer-motion";

export interface NumberTickerProps {
  value: number;
  decimalPlaces?: number;
  startValue?: number;
  className?: string;
}

export const NumberTicker = React.forwardRef<HTMLDivElement, NumberTickerProps>(
  (
    {
      value = 0,
      decimalPlaces = 0,
      startValue = 0,
      className,
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
      >
        {displayValue}
      </motion.div>
    );
  }
);

NumberTicker.displayName = "NumberTicker";
