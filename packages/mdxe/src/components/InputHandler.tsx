import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { MdxFrontmatter } from '@mdxui/ink/src/types';

interface InputFormProps {
  frontmatter: MdxFrontmatter;
  onSubmit: (values: Record<string, any>) => void;
}

const InputForm: React.FC<InputFormProps> = ({ frontmatter, onSubmit }) => {
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (Object.keys(inputValues).length > 0) {
      onSubmit(inputValues);
    }
  }, [inputValues, onSubmit]);
  
  if (!frontmatter.inputs || Object.keys(frontmatter.inputs).length === 0) {
    return null;
  }
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Input Parameters</Text>
      {Object.entries(frontmatter.inputs).map(([name, config]: [string, any]) => (
        <Box key={name} flexDirection="column" marginY={1}>
          <Text>
            {config.required ? '* ' : '  '}
            {name}
            {config.description ? ` - ${config.description}` : ''}
            {config.default !== undefined ? ` (default: ${config.default})` : ''}
            :
          </Text>
          <Box marginLeft={2}>
            <Text>{inputValues[name] || config.default || ''}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

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
        .filter(([_, config]) => (config as any).required)
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
