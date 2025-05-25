import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { z } from 'zod';
import { MdxFrontmatter } from '../types.js';
import { createSchemaFromFrontmatter } from '../schema.js';

interface InputFormProps {
  frontmatter: MdxFrontmatter;
  onSubmit: (values: Record<string, any>) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ frontmatter, onSubmit }) => {
  const { inputSchema } = createSchemaFromFrontmatter(frontmatter);
  
  if (!inputSchema || !frontmatter.inputs) {
    return null;
  }
  
  const inputFields = Object.entries(frontmatter.inputs);
  
  if (inputFields.length === 0) {
    return null;
  }
  
  return <InputFormFields fields={inputFields} schema={inputSchema} onSubmit={onSubmit} />;
};

interface InputFormFieldsProps {
  fields: [string, any][];
  schema: z.ZodObject<any>;
  onSubmit: (values: Record<string, any>) => void;
}

const InputFormFields: React.FC<InputFormFieldsProps> = ({ fields, schema, onSubmit }) => {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  const currentField = fields[currentFieldIndex];
  const [fieldName, fieldConfig] = currentField || ['', {}];
  
  const isLastField = currentFieldIndex === fields.length - 1;
  
  React.useEffect(() => {
    const defaultValues: Record<string, any> = {};
    
    fields.forEach(([name, config]) => {
      if (config.default !== undefined) {
        defaultValues[name] = config.default;
      }
    });
    
    setValues(prev => ({ ...prev, ...defaultValues }));
  }, [fields]);
  
  useInput((input, key) => {
    if (submitted) return;
    
    if (key.return) {
      try {
        const fieldSchema = schema.shape[fieldName];
        fieldSchema.parse(values[fieldName]);
        
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        
        if (isLastField) {
          try {
            schema.parse(values);
            setSubmitted(true);
            onSubmit(values);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const newErrors: Record<string, string> = {};
              error.errors.forEach(err => {
                const field = err.path[0] as string;
                newErrors[field] = err.message;
              });
              setErrors(prev => ({ ...prev, ...newErrors }));
              
              const firstErrorField = error.errors[0]?.path[0] as string;
              const firstErrorIndex = fields.findIndex(([name]) => name === firstErrorField);
              if (firstErrorIndex !== -1) {
                setCurrentFieldIndex(firstErrorIndex);
              }
            }
          }
        } else {
          setCurrentFieldIndex(prev => prev + 1);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(prev => ({ ...prev, [fieldName]: error.errors[0]?.message || 'Invalid input' }));
        }
      }
    } else if (key.escape) {
      setSubmitted(true);
      onSubmit({});
    } else if (key.upArrow && currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
    } else if (key.downArrow && !isLastField) {
      setCurrentFieldIndex(prev => prev + 1);
    }
  });
  
  if (submitted) {
    return null;
  }
  
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold>Input Parameters</Text>
      
      {fields.map(([name, config], index) => (
        <Box key={name} flexDirection="column" marginY={1}>
          <Box>
            <Text color={currentFieldIndex === index ? 'green' : 'white'}>
              {config.required ? '* ' : '  '}
              {name}
              {config.description ? ` - ${config.description}` : ''}
              {config.default !== undefined ? ` (default: ${config.default})` : ''}
              :
            </Text>
          </Box>
          
          {currentFieldIndex === index && (
            <Box marginLeft={2}>
              <InputField
                name={name}
                config={config}
                value={values[name]}
                onChange={(value) => setValues(prev => ({ ...prev, [name]: value }))}
              />
            </Box>
          )}
          
          {errors[name] && (
            <Box marginLeft={2}>
              <Text color="red">{errors[name]}</Text>
            </Box>
          )}
        </Box>
      ))}
      
      <Box marginTop={1}>
        <Text dimColor>
          Press <Text color="green">Enter</Text> to {isLastField ? 'submit' : 'continue'}, 
          <Text color="yellow"> ↑/↓</Text> to navigate, 
          <Text color="red"> Esc</Text> to cancel
        </Text>
      </Box>
    </Box>
  );
};

interface InputFieldProps {
  name: string;
  config: any;
  value: any;
  onChange: (value: any) => void;
}

const InputField: React.FC<InputFieldProps> = ({ name, config, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value !== undefined ? String(value) : '');
  
  useInput((input, key) => {
    if (key.backspace || key.delete) {
      setInputValue(currentValue => {
        const newValue = currentValue.slice(0, -1);
        onChange(convertValue(newValue, config.type));
        return newValue;
      });
    } else if (!key.return && !key.escape && !key.upArrow && !key.downArrow) {
      if (config.type === 'boolean') {
        if (input === 'y' || input === 'Y' || input === 't' || input === 'T') {
          setInputValue('true');
          onChange(true);
        } else if (input === 'n' || input === 'N' || input === 'f' || input === 'F') {
          setInputValue('false');
          onChange(false);
        }
      } else {
        setInputValue(currentValue => {
          const newValue = currentValue + input;
          onChange(convertValue(newValue, config.type));
          return newValue;
        });
      }
    }
  });
  
  return (
    <Box>
      <Text>
        {config.type === 'boolean' ? (
          <>
            <Text color={value === true ? 'green' : 'white'}>[{value === true ? 'X' : ' '}] Yes</Text>
            <Text> / </Text>
            <Text color={value === false ? 'green' : 'white'}>[{value === false ? 'X' : ' '}] No</Text>
            <Text> (y/n)</Text>
          </>
        ) : (
          <Text>{inputValue}<Text color="gray">_</Text></Text>
        )}
      </Text>
    </Box>
  );
};

function convertValue(value: string, type: string): any {
  if (!value) return undefined;
  
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
}
