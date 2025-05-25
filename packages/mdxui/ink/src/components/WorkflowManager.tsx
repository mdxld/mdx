import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { createWorkflowFromFrontmatter, executeWorkflowStep } from '../workflow';
import type { WorkflowFrontmatter } from '../types';
import { InputForm } from './InputForm';

interface WorkflowManagerProps {
  frontmatter: WorkflowFrontmatter;
  onComplete?: (results: Record<string, any>) => void;
  onCancel?: () => void;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  frontmatter,
  onComplete,
  onCancel
}) => {
  const workflow = createWorkflowFromFrontmatter(frontmatter);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  
  if (!workflow) {
    return (
      <Box>
        <Text color="yellow">No workflow defined in frontmatter</Text>
      </Box>
    );
  }
  
  const currentStep = workflow.steps[currentStepIndex];
  
  const handleStepSubmit = async (inputData: Record<string, any>) => {
    try {
      setStatus('running');
      setError(null);
      
      const result = await executeWorkflowStep(currentStep, inputData, stepResults);
      
      const updatedResults = {
        ...stepResults,
        [currentStep.id]: result
      };
      setStepResults(updatedResults);
      
      if (currentStepIndex < workflow.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setStatus('completed');
        if (onComplete) {
          onComplete(updatedResults);
        }
      }
    } catch (err) {
      setStatus('failed');
      setError(`Error executing step: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  return (
    <Box flexDirection="column">
      <WorkflowHeader workflow={workflow} currentStep={currentStepIndex + 1} totalSteps={workflow.steps.length} />
      
      {status === 'failed' && error && (
        <Box marginY={1} borderStyle="round" borderColor="red" padding={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      
      <Box marginY={1}>
        <StepDisplay 
          step={currentStep} 
          stepNumber={currentStepIndex + 1} 
          totalSteps={workflow.steps.length}
          onSubmit={handleStepSubmit}
          onBack={currentStepIndex > 0 ? handleBack : undefined}
          onCancel={handleCancel}
        />
      </Box>
      
      <WorkflowProgress 
        currentStep={currentStepIndex + 1} 
        totalSteps={workflow.steps.length} 
      />
    </Box>
  );
};

interface WorkflowHeaderProps {
  workflow: {
    name: string;
    description?: string;
  };
  currentStep: number;
  totalSteps: number;
}

const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ 
  workflow, 
  currentStep, 
  totalSteps 
}) => {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
      <Text bold color="blue">{workflow.name}</Text>
      {workflow.description && (
        <Text>{workflow.description}</Text>
      )}
      <Text>
        Step <Text color="green">{currentStep}</Text> of <Text color="green">{totalSteps}</Text>
      </Text>
    </Box>
  );
};

interface StepDisplayProps {
  step: {
    id: string;
    name: string;
    description?: string;
    inputSchema?: any;
  };
  stepNumber: number;
  totalSteps: number;
  onSubmit: (inputData: Record<string, any>) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

const StepDisplay: React.FC<StepDisplayProps> = ({ 
  step, 
  stepNumber, 
  totalSteps,
  onSubmit,
  onBack,
  onCancel
}) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>
          Step {stepNumber}: <Text color="green">{step.name}</Text>
        </Text>
      </Box>
      
      {step.description && (
        <Box marginBottom={1}>
          <Text>{step.description}</Text>
        </Box>
      )}
      
      <InputForm 
        frontmatter={{ inputs: step.inputSchema?.shape || {} }} 
        onSubmit={onSubmit} 
      />
      
      <Box marginTop={1}>
        <Text dimColor>
          {onBack && (
            <>
              Press <Text color="yellow">B</Text> to go back, 
            </>
          )}
          {onCancel && (
            <>
              Press <Text color="red">Esc</Text> to cancel
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
};

interface WorkflowProgressProps {
  currentStep: number;
  totalSteps: number;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  const progressWidth = 40; // Total width of the progress bar
  const filledWidth = Math.floor((currentStep / totalSteps) * progressWidth);
  
  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text color="blue">[</Text>
        <Text color="green">{'='.repeat(filledWidth)}</Text>
        <Text color="gray">{' '.repeat(progressWidth - filledWidth)}</Text>
        <Text color="blue">]</Text>
        <Text> {Math.round((currentStep / totalSteps) * 100)}%</Text>
      </Box>
    </Box>
  );
};
