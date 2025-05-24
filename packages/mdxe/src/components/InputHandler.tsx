import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { InputForm } from '@mdxui/ink';
import type { MdxFrontmatter } from '@mdxui/ink';

interface InputHandlerProps {
  frontmatter: MdxFrontmatter;
  onInputsCollected: (inputs: Record<string, any>) => void;
  initialInputs?: Record<string, any>;
}

export const InputHandler: React.FC<InputHandlerProps> = ({ 
  frontmatter, 
  onInputsCollected,
  initialInputs = {}
}) => {
  const [inputs, setInputs] = useState<Record<string, any>>(initialInputs);
  const [isCollectingInputs, setIsCollectingInputs] = useState(false);
  
  useEffect(() => {
    if (frontmatter.inputs && Object.keys(frontmatter.inputs).length > 0) {
      const requiredInputs = Object.entries(frontmatter.inputs)
        .filter(([_, config]) => config.required)
        .map(([name]) => name);
      
      const missingRequiredInputs = requiredInputs.filter(name => 
        inputs[name] === undefined || inputs[name] === null || inputs[name] === ''
      );
      
      if (missingRequiredInputs.length > 0) {
        setIsCollectingInputs(true);
      } else {
        onInputsCollected(inputs);
      }
    } else {
      onInputsCollected(inputs);
    }
  }, [frontmatter, inputs]);
  
  const handleInputSubmit = (values: Record<string, any>) => {
    setInputs(prev => ({ ...prev, ...values }));
    setIsCollectingInputs(false);
    onInputsCollected({ ...inputs, ...values });
  };
  
  if (!isCollectingInputs) {
    return null;
  }
  
  return (
    <Box flexDirection="column">
      <InputForm 
        frontmatter={frontmatter} 
        onSubmit={handleInputSubmit} 
      />
    </Box>
  );
};
