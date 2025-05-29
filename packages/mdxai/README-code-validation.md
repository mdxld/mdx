# Code Generation with Validation

This package provides AI-powered code generation with built-in validation for JSDoc, TypeScript syntax, and test structure - all running **directly from strings without creating temporary files**.

## Features

- **JSDoc Validation**: Parse and validate JSDoc comments using TypeScript's AST
- **TypeScript Syntax Validation**: Check TypeScript syntax without full type checking
- **Test Structure Validation**: Validate that test code contains proper test structure (describe, it, expect)
- **Code Pattern Analysis**: Analyze code for common patterns (exports, functions, types, comments)
- **No Temporary Files**: Everything runs in memory using TypeScript's compiler API

## Usage

### Basic Code Generation

```typescript
import { code } from 'mdxai/functions/code'

const result = await code`a function that calculates the factorial of a number`

console.log(result.functionName) // e.g., "factorial"
console.log(result.code)         // Generated TypeScript function
console.log(result.tests)        // Generated Vitest tests
```

### Code Generation with Validation

```typescript
import { codeWithValidation } from 'mdxai/functions/code'

const result = await codeWithValidation`a function that calculates the factorial of a number`

// Check validation results
if (result.validation) {
  console.log('JSDoc valid:', result.validation.jsdoc.valid)
  console.log('TypeScript valid:', result.validation.typescript.valid)
  console.log('Test syntax valid:', result.validation.syntax.valid)
  
  // Show any errors
  if (!result.validation.syntax.valid) {
    console.log('Test errors:', result.validation.syntax.errors)
  }
}
```

### Manual Validation

You can also validate code manually:

```typescript
import { 
  validateJSDoc, 
  validateTypeScript, 
  validateTestSyntax,
  analyzeCodePatterns
} from 'mdxai/functions/code-validator-simple'

// Validate JSDoc
const jsdocResult = validateJSDoc(codeString)

// Validate TypeScript syntax
const tsResult = validateTypeScript(codeString)

// Validate test structure
const testResult = validateTestSyntax(testCode)

// Analyze code patterns
const patterns = analyzeCodePatterns(codeString)
console.log('Has exports:', patterns.hasExports)
console.log('Has functions:', patterns.hasFunctions)
```

## How It Works

### TypeScript Syntax Validation

Uses TypeScript's compiler API to validate syntax without writing files:

```typescript
const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true)
const syntaxDiagnostics = sourceFile.parseDiagnostics || []
// Check for syntax errors
```

### JSDoc Parsing

Extracts and validates JSDoc comments using TypeScript's AST:

```typescript
const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true)
const jsDocComments = ts.getJSDocCommentsAndTags(node)
// Parse and validate JSDoc structure
```

### Test Structure Validation

Checks for proper test structure without executing tests:

```typescript
// Check for test framework patterns
if (!testCode.includes('describe') && !testCode.includes('it')) {
  errors.push('Test code should contain describe, it, or test blocks')
}
if (!testCode.includes('expect')) {
  errors.push('Test code should contain expect assertions')
}
```

### Code Pattern Analysis

Uses regex patterns to detect common code structures:

```typescript
const patterns = {
  hasExports: /export\s+(function|const|class|interface|type)/.test(code),
  hasFunctions: /(function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{)/.test(code),
  hasTypes: /:\s*(string|number|boolean|object|\w+\[\])/.test(code),
  hasComments: /\/\*\*[\s\S]*?\*\/|\/\//.test(code)
}
```

## Example Output

```typescript
const result = await codeWithValidation`a function that adds two numbers`

// Result structure:
{
  functionName: "add",
  description: "Adds two numbers together",
  type: "/**\n * Adds two numbers together\n * @param a First number\n * @param b Second number\n * @returns The sum of a and b\n */",
  code: "export function add(a: number, b: number): number {\n  return a + b\n}",
  tests: "describe('add function', () => {\n  it('should add two numbers correctly', () => {\n    expect(add(2, 3)).toBe(5)\n  })\n})",
  validation: {
    jsdoc: { valid: true, errors: [], parsed: [...] },
    typescript: { valid: true, errors: [] },
    syntax: { valid: true, errors: [] }
  }
}
```

## Benefits

1. **No File System Pollution**: Everything runs in memory
2. **Fast Execution**: No I/O overhead from temporary files
3. **Practical Validation**: Focuses on syntax and structure rather than complex execution
4. **Integrated Workflow**: Generate and validate in one step
5. **Detailed Error Reporting**: Precise error messages with line numbers
6. **Pattern Analysis**: Understand code structure at a glance

## Alternative: Full Vitest Execution

For cases where you need to actually run the tests (not just validate syntax), you can use the more complex `code-validator.ts` which includes:

- Full Vitest programmatic execution using virtual modules
- Real test execution with pass/fail results
- More complex setup but actual test verification

However, for most validation purposes, the simpler approach is recommended as it's faster and more reliable.

## Dependencies

- `typescript`: For syntax validation and JSDoc parsing
- `zod`: For schema validation

## Running the Example

```bash
cd packages/mdxai
pnpm build
node dist/functions/code-example.js
```

This will generate a factorial function with full validation and show the results.

## Testing

```bash
pnpm test src/functions/code-validator-simple.test.ts
```

All tests should pass, demonstrating the validation functionality works correctly. 