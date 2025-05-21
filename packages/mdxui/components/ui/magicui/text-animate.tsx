"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { motion, Variants, HTMLMotionProps } from "framer-motion";

export interface TextAnimateProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  textClassName?: string;
  staggerChildren?: number;
  once?: boolean;
  animateOnView?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

export const TextAnimate = React.forwardRef<HTMLDivElement, TextAnimateProps>(
  (
    {
      text,
      delay = 0,
      duration = 0.05,
      className,
      textClassName,
      staggerChildren = 0.1,
      once = true,
      animateOnView = true,
      id,
      style,
    },
    ref
  ) => {
    const containerVariants: Variants = {
      hidden: {
        opacity: 0,
      },
      visible: (i = 1) => ({
        opacity: 1,
        transition: {
          staggerChildren,
          delayChildren: delay * i,
        },
      }),
    };

    const childVariants: Variants = {
      hidden: {
        opacity: 0,
        y: 20,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 100,
        },
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 100,
          duration,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn("", className)}
        variants={containerVariants}
        initial="hidden"
        animate={animateOnView ? undefined : "visible"}
        whileInView={animateOnView ? "visible" : undefined}
        viewport={{ once }}
        id={id}
        style={style}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden className={cn("flex flex-wrap", textClassName)}>
          {text.split(" ").map((word, wordIndex) => (
            <span key={`word-${wordIndex}`} className="mr-1.5 mt-1.5 inline-block">
              {word.split("").map((char, charIndex) => (
                <motion.span
                  key={`char-${charIndex}`}
                  className="inline-block"
                  variants={childVariants}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          ))}
        </span>
      </motion.div>
    );
  }
);

TextAnimate.displayName = "TextAnimate";
