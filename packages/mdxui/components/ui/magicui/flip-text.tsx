"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion } from "framer-motion";

export interface FlipTextProps extends React.HTMLAttributes<HTMLDivElement> {
  frontText: string;
  backText: string;
  flipOnHover?: boolean;
  flipDuration?: number;
  className?: string;
  frontClassName?: string;
  backClassName?: string;
}

export const FlipText = React.forwardRef<HTMLDivElement, FlipTextProps>(
  (
    {
      frontText,
      backText,
      flipOnHover = true,
      flipDuration = 0.6,
      className,
      frontClassName,
      backClassName,
      ...props
    },
    ref
  ) => {
    const [isFlipped, setIsFlipped] = React.useState(false);

    const handleFlip = () => {
      if (flipOnHover) return;
      setIsFlipped(!isFlipped);
    };

    const handleMouseEnter = () => {
      if (flipOnHover) setIsFlipped(true);
    };

    const handleMouseLeave = () => {
      if (flipOnHover) setIsFlipped(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative cursor-pointer perspective-[1000px]",
          className
        )}
        onClick={handleFlip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.div
          className={cn(
            "absolute inset-0 backface-hidden",
            isFlipped ? "opacity-0" : "opacity-100",
            frontClassName
          )}
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ duration: flipDuration }}
        >
          {frontText}
        </motion.div>
        <motion.div
          className={cn(
            "absolute inset-0 backface-hidden",
            isFlipped ? "opacity-100" : "opacity-0",
            backClassName
          )}
          animate={{ rotateX: isFlipped ? 0 : -180 }}
          transition={{ duration: flipDuration }}
        >
          {backText}
        </motion.div>
      </div>
    );
  }
);

FlipText.displayName = "FlipText";
