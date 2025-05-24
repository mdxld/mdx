import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { useMemo } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding } from "./font";
import React from "react";

export type Props = {
  steps: HighlightedCode[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
  theme?: string;
  width?: {
    type: "auto" | "fixed";
    value?: number;
  };
};

const AbsoluteFillComponent = AbsoluteFill as any;
const SeriesComponent = Series as any;
const SeriesSequenceComponent = Series.Sequence as any;

export const Main: React.FC<Props> = ({ steps, themeColors, codeWidth }) => {
  if (!steps) {
    throw new Error("Steps are not defined");
  }

  const { durationInFrames } = useVideoConfig();
  const stepDuration = durationInFrames / steps.length;
  const transitionDuration = 30;

  if (!themeColors) {
    throw new Error("Theme colors are not defined");
  }

  const outerStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: themeColors.background,
    };
  }, [themeColors]);

  const style: React.CSSProperties = useMemo(() => {
    return {
      padding: `${verticalPadding}px 0px`,
    };
  }, []);

  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFillComponent style={outerStyle}>
        <AbsoluteFillComponent
          style={{
            width: codeWidth || "100%",
            margin: "auto",
          }}
        >
          <ProgressBar steps={steps} />
          <AbsoluteFillComponent style={style}>
            <SeriesComponent>
              {steps.map((step, index) => (
                <SeriesSequenceComponent
                  key={index}
                  layout="none"
                  durationInFrames={stepDuration}
                  name={step.meta}
                >
                  <CodeTransition
                    oldCode={steps[index - 1]}
                    newCode={step}
                    durationInFrames={transitionDuration}
                  />
                </SeriesSequenceComponent>
              ))}
            </SeriesComponent>
          </AbsoluteFillComponent>
        </AbsoluteFillComponent>
      </AbsoluteFillComponent>
      <RefreshOnCodeChange />
    </ThemeProvider>
  );
};
