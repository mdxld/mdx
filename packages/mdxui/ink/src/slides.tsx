import React, { useState, useEffect, ReactNode } from 'react';
import { Box, Text, useInput } from 'ink';
import BigText from 'ink-big-text';
import Markdown from './markdown.js';
import { Children, isValidElement, cloneElement } from 'react';

/**
 * Props for the Slides component
 */
interface SlidesProps {
  /** Child slide components */
  children: React.ReactNode;
  /** Optional configuration options */
  options?: {
    /** Whether to show slide numbers */
    slideNumber?: boolean;
    /** Whether to show navigation help */
    showHelp?: boolean;
    /** Custom colors */
    colors?: {
      /** Color for slide titles */
      title?: string;
      /** Color for slide content */
      content?: string;
      /** Color for navigation help */
      help?: string;
      /** Color for slide numbers */
      slideNumber?: string;
    };
  };
}

/**
 * Terminal-based slide deck component using Ink
 */
export function Slides({ children, options }: SlidesProps) {
  const defaultOptions = {
    slideNumber: true,
    showHelp: true,
    colors: {
      title: 'green',
      content: 'white',
      help: 'gray',
      slideNumber: 'yellow',
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    colors: {
      ...defaultOptions.colors,
      ...(options?.colors || {})
    }
  };

  const slides = Children.toArray(children).filter(
    child => isValidElement(child) && child.type && (child.type as any).displayName === 'Slide'
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [exit, setExit] = useState(false);

  useInput((input, key) => {
    if (key.leftArrow) {
      setCurrentSlideIndex(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
    } else if (input === 'q' || key.escape) {
      setExit(true);
    }
  });

  if (exit) {
    return null;
  }

  const currentSlide = slides[currentSlideIndex];

  if (slides.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">No slides found. Make sure to use the Slide component.</Text>
      </Box>
    );
  }

  const enhancedSlide = isValidElement(currentSlide)
    ? cloneElement(currentSlide as React.ReactElement, {
        index: currentSlideIndex,
        total: slides.length,
      })
    : null;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Render the current slide */}
      {enhancedSlide}

      {/* Navigation help and slide counter */}
      <Box marginTop={1}>
        {mergedOptions.showHelp && (
          <Box marginRight={2}>
            <Text color={mergedOptions.colors.help}>
              Use ← → arrows to navigate, q to quit
            </Text>
          </Box>
        )}
        
        {mergedOptions.slideNumber && (
          <Text color={mergedOptions.colors.slideNumber}>
            Slide {currentSlideIndex + 1} of {slides.length}
          </Text>
        )}
      </Box>
    </Box>
  );
}

Slides.displayName = 'Slides';
