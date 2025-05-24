import React from 'react';
import { Text as InkText, Box, TextProps, BoxProps } from 'ink';
import chalk from 'chalk';

/**
 * Text component with chalk styling
 */
export function Text({ color, ...props }: TextProps & { color?: string }) {
  if (color) {
    return (
      <InkText {...props} color={color} />
    );
  }
  
  return <InkText {...props} />;
}

/**
 * Box component with chalk styling
 */
export function PastelBox({ borderColor, ...props }: BoxProps & { borderColor?: string }) {
  if (borderColor) {
    return (
      <Box {...props} borderColor={borderColor} />
    );
  }
  
  return <Box {...props} />;
}

/**
 * Default components to provide to MDX
 */
export const defaultComponents = {
  Text,
  Box: PastelBox,
};
