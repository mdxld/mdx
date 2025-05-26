import React from 'react';
import { Box, Text } from 'ink';
import Markdown from '../markdown.js';

/**
 * Screen component for defining a screen in a multi-screen CLI app
 */
export const Screen: React.FC<{
  name: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ name, active = false, children }) => {
  if (!active) return null;
  
  return (
    <Box flexDirection="column">
      {children}
    </Box>
  );
};

/**
 * Screens container for managing multiple screens
 */
export const Screens: React.FC<{
  initial: string;
  children: React.ReactNode;
}> = ({ initial, children }) => {
  const [currentScreen, setCurrentScreen] = React.useState(initial);
  
  const screens = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Screen) {
      return React.cloneElement(child as React.ReactElement<{
        name: string;
        active?: boolean;
        children: React.ReactNode;
      }>, {
        active: child.props.name === currentScreen
      });
    }
    return child;
  });
  
  const screenContext = React.useMemo(() => ({
    currentScreen,
    go: (screen: string) => setCurrentScreen(screen),
    exit: () => process.exit(0)
  }), [currentScreen]);
  
  return (
    <ScreenContext.Provider value={screenContext}>
      {screens}
    </ScreenContext.Provider>
  );
};

/**
 * Context for screen navigation
 */
export const ScreenContext = React.createContext<{
  currentScreen: string;
  go: (screen: string) => void;
  exit: () => void;
}>({
  currentScreen: '',
  go: () => {},
  exit: () => {}
});

/**
 * Hook for accessing screen context
 */
export const useScreen = () => React.useContext(ScreenContext);

/**
 * Menu component for navigation
 */
export const Menu: React.FC<{
  options: Array<{ label: string; value: string }>;
  onSelect?: (option: { value: string; label: string; go: (screen: string) => void; exit: () => void }) => void;
}> = ({ options, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const { go, exit } = useScreen();
  
  React.useEffect(() => {
    const handleKeyPress = (key: any) => {
      if (key.name === 'up' && selectedIndex > 0) {
        setSelectedIndex(prev => prev - 1);
      } else if (key.name === 'down' && selectedIndex < options.length - 1) {
        setSelectedIndex(prev => prev + 1);
      } else if (key.name === 'return') {
        const option = options[selectedIndex];
        if (onSelect) {
          onSelect({ ...option, go, exit });
        } else if (option.value === 'exit') {
          exit();
        } else {
          go(option.value);
        }
      }
    };
    
    process.stdin.on('keypress', handleKeyPress);
    return () => {
      process.stdin.removeListener('keypress', handleKeyPress);
    };
  }, [selectedIndex, options, onSelect, go, exit]);
  
  return (
    <Box flexDirection="column" marginY={1}>
      {options.map((option, index) => (
        <Text key={index} color={index === selectedIndex ? 'green' : undefined}>
          {index === selectedIndex ? '→ ' : '  '}
          {option.label}
        </Text>
      ))}
    </Box>
  );
};

/**
 * Form component for input collection
 */
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  validate?: (value: string) => true | string;
  formData?: Record<string, any>;
  setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

interface FormSubmitProps {
  label: string;
  onClick?: () => void;
}

interface FormComponent extends React.FC<{
  onSubmit?: (formData: any) => void;
  onCancel?: () => void;
  children: React.ReactNode;
}> {
  Field: React.FC<FormFieldProps>;
  Submit: React.FC<FormSubmitProps>;
}

export const Form: FormComponent = ({ onSubmit, onCancel, children }) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  
  const formFields = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        formData,
        setFormData
      });
    }
    return child;
  });
  
  return (
    <Box flexDirection="column">
      {formFields}
    </Box>
  );
};

Form.Field = ({ 
  name, 
  label, 
  type = 'text',
  validate,
  formData,
  setFormData
}: FormFieldProps) => {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  
  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (validate) {
      const validationResult = validate(newValue);
      if (validationResult !== true) {
        setError(validationResult);
      } else {
        setError(null);
      }
    }
    
    if (setFormData) {
      setFormData({
        ...formData,
        [name]: newValue
      });
    }
  };
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text>{label} </Text>
        <Text>{value}</Text>
      </Box>
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};

Form.Submit = ({ label, onClick }: FormSubmitProps) => {
  return (
    <Box marginY={1}>
      <Text color="green">{label}</Text>
    </Box>
  );
};

/**
 * ItemList component for displaying lists of items
 */
export const ItemList: React.FC<{
  items: any[];
  itemProp?: string;
}> = ({ items, itemProp }) => {
  if (!items || items.length === 0) {
    return <Text>(No items)</Text>;
  }
  
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Text key={index}>
          • {itemProp ? item[itemProp] : JSON.stringify(item)}
        </Text>
      ))}
    </Box>
  );
};

/**
 * Execute component for running TypeScript code blocks
 */
export const Execute: React.FC<{
  code: string;
  resultName?: string;
}> = ({ code, resultName }) => {
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const executeCode = async () => {
      try {
        setLoading(true);
        setResult({ message: 'Code execution simulated' });
      } catch (err) {
        setError(`Error executing code: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    executeCode();
  }, [code]);
  
  if (loading) {
    return <Text color="yellow">Executing code...</Text>;
  }
  
  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }
  
  if (resultName && result) {
    return null;
  }
  
  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="green">Code executed successfully</Text>
      {result && typeof result === 'object' && (
        <Text>{JSON.stringify(result, null, 2)}</Text>
      )}
    </Box>
  );
};

/**
 * Export all components
 */
export const components = {
  Screen,
  Screens,
  Menu,
  Form,
  ItemList,
  Execute,
  Markdown: (props: any) => <Markdown>{props.children}</Markdown>
};

// Export event status components
export * from './EventStatus';
export * from './EventProgressIndicator';
export * from './EventListDisplay';
export * from './EventStatusProvider';
