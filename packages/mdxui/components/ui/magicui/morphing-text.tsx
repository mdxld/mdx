"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion } from "framer-motion";

export interface MorphingTextProps extends React.HTMLAttributes<HTMLDivElement> {
  texts: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  duration?: number;
}

export const MorphingText = React.forwardRef<HTMLDivElement, MorphingTextProps>(
  (
    {
      texts = [],
      interval = 3000,
      className,
      textClassName,
      duration = 0.5,
      ...props
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      if (texts.length <= 1) return;

      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }, interval);

      return () => clearInterval(timer);
    }, [texts, interval]);

    const variants = {
      enter: {
        opacity: 0,
        y: 20,
      },
      center: {
        opacity: 1,
        y: 0,
      },
      exit: {
        opacity: 0,
        y: -20,
      },
    };

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        <div className="relative overflow-hidden">
          <motion.div
            key={currentIndex}
            className={cn("", textClassName)}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{
              duration,
              ease: "easeInOut",
            }}
          >
            {texts[currentIndex]}
          </motion.div>
        </div>
      </div>
    );
  }
);

MorphingText.displayName = "MorphingText";
