"use client";

import * as React from "react";
import { cn } from "../../../lib/utils.js";

export interface ConfettiProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: "load" | "click";
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  drift?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
  shapes?: ("square" | "circle")[];
  ticks?: number;
}

export const Confetti = React.forwardRef<HTMLDivElement, ConfettiProps>(
  (
    {
      trigger = "click",
      particleCount = 50,
      spread = 70,
      startVelocity = 30,
      decay = 0.9,
      scalar = 1,
      drift = 0,
      origin = { x: 0.5, y: 0.5 },
      colors,
      shapes,
      ticks = 60,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleClick = () => {
      if (trigger === "click") {
        console.log("Confetti triggered!");
      }
    };

    React.useEffect(() => {
      if (trigger === "load") {
        console.log("Confetti triggered on load!");
      }
    }, [trigger]);

    return (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
          containerRef.current = node;
        }}
        className={cn(trigger === "click" ? "cursor-pointer" : "", className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Confetti.displayName = "Confetti";
