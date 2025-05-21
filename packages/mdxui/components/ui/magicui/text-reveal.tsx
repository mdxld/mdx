"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion } from "framer-motion";

export interface TextRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  revealText?: string;
  revealColor?: string;
  textColor?: string;
  className?: string;
  textClassName?: string;
  revealClassName?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  animateOnView?: boolean;
}

export const TextReveal = React.forwardRef<HTMLDivElement, TextRevealProps>(
  (
    {
      text,
      revealText = text,
      revealColor = "#000",
      textColor = "#fff",
      className,
      textClassName,
      revealClassName,
      delay = 0,
      duration = 0.5,
      once = true,
      animateOnView = true,
      ...props
    },
    ref
  ) => {
    const containerVariants = {
      hidden: {
        opacity: 0,
      },
      visible: {
        opacity: 1,
        transition: {
          delay,
          duration,
        },
      },
    };

    const revealVariants = {
      hidden: {
        opacity: 0,
        y: 20,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: delay + duration * 0.5,
          duration: duration * 0.5,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn("relative", className)}
        variants={containerVariants}
        initial="hidden"
        animate={animateOnView ? undefined : "visible"}
        whileInView={animateOnView ? "visible" : undefined}
        viewport={{ once }}
        {...props}
      >
        <div
          className={cn("relative z-10", textClassName)}
          style={{ color: textColor }}
        >
          {text}
        </div>
        <motion.div
          className={cn("absolute inset-0", revealClassName)}
          style={{ color: revealColor }}
          variants={revealVariants}
        >
          {revealText}
        </motion.div>
      </motion.div>
    );
  }
);

TextReveal.displayName = "TextReveal";
