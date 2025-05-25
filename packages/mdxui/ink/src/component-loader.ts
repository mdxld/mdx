import fs from 'fs/promises';
import path from 'path';
import React from 'react';
import { defaultComponents } from './components';

/**
 * Possible file extensions for mdx-components files
 */
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Possible locations for mdx-components files
 */
const LOCATIONS = ['', 'src/'];

/**
 * Type for MDX component mapping
 */
export type MDXComponents = Record<string, React.ComponentType<any>>;

/**
 * Type for useMDXComponents function
 */
export type UseMDXComponents = (components: MDXComponents) => MDXComponents;

/**
 * Check if a file exists at the given path
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the mdx-components file in the project
 * Searches in the project root and src/ directory with various extensions
 */
export async function findMdxComponentsFile(cwd = process.cwd()): Promise<string | null> {
  const customPath = process.env.INK_MDX_COMPONENTS;
  if (customPath) {
    const resolvedPath = path.resolve(cwd, customPath);
    if (await fileExists(resolvedPath)) {
      return resolvedPath;
    }
    console.warn(`INK_MDX_COMPONENTS path not found: ${customPath}`);
  }

  for (const location of LOCATIONS) {
    for (const ext of EXTENSIONS) {
      const filePath = path.join(cwd, location, `mdx-components${ext}`);
      if (await fileExists(filePath)) {
        return filePath;
      }
    }
  }

  return null;
}

/**
 * Load the mdx-components file and get the component mapping
 */
export async function loadMdxComponents(): Promise<MDXComponents> {
  const componentsFilePath = await findMdxComponentsFile();
  
  if (!componentsFilePath) {
    return defaultComponents;
  }

  try {
    const userComponents = await import(componentsFilePath);
    
    if (typeof userComponents.useMDXComponents === 'function') {
      return userComponents.useMDXComponents(defaultComponents);
    }
    
    if (userComponents.default) {
      return { ...defaultComponents, ...userComponents.default };
    }
    
    const componentMapping = { ...defaultComponents };
    
    for (const [key, value] of Object.entries(userComponents)) {
      if (key !== 'useMDXComponents' && typeof value === 'function') {
        componentMapping[key] = value;
      }
    }
    
    return componentMapping;
  } catch (error) {
    console.error(`Error loading MDX components from ${componentsFilePath}:`, error);
    return defaultComponents;
  }
}

/**
 * Merge component mappings with user overrides taking precedence
 */
export function mergeComponents(
  defaults: MDXComponents,
  overrides?: MDXComponents
): MDXComponents {
  if (!overrides) {
    return defaults;
  }
  
  return { ...defaults, ...overrides };
}
