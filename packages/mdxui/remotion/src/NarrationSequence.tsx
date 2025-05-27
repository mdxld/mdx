import React from "react";
import { Series, useVideoConfig } from "remotion";
import { useNarrationAudio } from "./hooks/useNarrationAudio";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { CodeTransition } from "./CodeTransition";
import { AbsoluteFill } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { verticalPadding } from "./font";
import { useMemo } from "react";

const AbsoluteFillComponent = AbsoluteFill as any;
const SeriesComponent = Series as any;
const SeriesSequenceComponent = Series.Sequence as any;

type NarrationSequenceProps = {
  steps: HighlightedCode[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
  theme?: string;
  width?: {
    type: "auto" | "fixed";
    value?: number;
  };
  narrationText: string;
  voiceName?: string;
  transitionDuration?: number;
};

export const NarrationSequence: React.FC<NarrationSequenceProps> = ({
  steps,
  themeColors,
  codeWidth,
  theme,
  width,
  narrationText,
  voiceName,
  transitionDuration = 30, // Default to 30 frames as in Main.tsx
}) => {
  const { fps } = useVideoConfig();
  const { audioSrc, audioDuration, isLoading, error } = useNarrationAudio(
    narrationText,
    {
      voiceName,
    },
  );

  if (!steps) {
    throw new Error("Steps are not defined");
  }

  if (!themeColors) {
    throw new Error("Theme colors are not defined");
  }

  const totalContentDuration = audioDuration || fps * 10; // Default to 10 seconds if no audio

  const totalTransitionDuration = (steps.length - 1) * transitionDuration;
  const availableContentDuration = Math.max(
    totalContentDuration - totalTransitionDuration,
    0,
  );
  const stepDuration = Math.ceil(availableContentDuration / steps.length);

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

  if (isLoading) {
    return <div>Generating narration audio...</div>;
  }

  if (error) {
    console.error("Error generating narration:", error);
    return <div>Error generating narration. Check console for details.</div>;
  }

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
              {audioSrc && (
                <SeriesSequenceComponent
                  name="Audio"
                  durationInFrames={audioDuration || 1}
                >
                  <audio src={audioSrc} />
                </SeriesSequenceComponent>
              )}

              {steps.map((step, index) => (
                <SeriesSequenceComponent
                  key={index}
                  layout="none"
                  durationInFrames={stepDuration}
                  name={step.meta}
                >
                  {index > 0 ? (
                    <CodeTransition
                      oldCode={steps[index - 1]}
                      newCode={step}
                      durationInFrames={transitionDuration}
                    />
                  ) : (
                    <CodeTransition
                      oldCode={null}
                      newCode={step}
                      durationInFrames={transitionDuration}
                    />
                  )}
                </SeriesSequenceComponent>
              ))}
            </SeriesComponent>
          </AbsoluteFillComponent>
        </AbsoluteFillComponent>
      </AbsoluteFillComponent>
    </ThemeProvider>
  );
};
