"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion, useSpring, useTransform } from "framer-motion";

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
      direction = "up",
      delay = 0,
      decimalPlaces = 0,
      startValue = 0,
      className,
      ...props
    },
    ref
  ) => {
    const spring = useSpring(startValue, {
      delay: delay,
      bounce: 0,
      stiffness: 80,
      damping: 20,
    });

    React.useEffect(() => {
      spring.set(value);
    }, [spring, value]);

    const displayValue = useTransform(spring, (current) =>
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
