import React from 'react';
import { Pre as CodehikePre, HighlightedCode, AnnotationHandler } from 'codehike/code';

interface PreWrapperProps {
  code: HighlightedCode;
  handlers?: AnnotationHandler[];
  style?: React.CSSProperties;
}

export const PreWrapper = React.forwardRef<HTMLPreElement, PreWrapperProps>(
  ({ code, handlers, style, ...props }, ref) => {
    const PreComponent = CodehikePre as any;
    return <PreComponent ref={ref} code={code} handlers={handlers} style={style} {...props} />;
  }
);

PreWrapper.displayName = 'PreWrapper';
