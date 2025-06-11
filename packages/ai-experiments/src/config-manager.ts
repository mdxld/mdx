/**
 * External configuration management for deploying optimal settings
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { StorageManager } from './storage.js';
import { generateOptimalConfig } from './evolution.js';

export interface ConfigExportOptions {
  format: 'json' | 'yaml' | 'env' | 'typescript';
  includeMetadata?: boolean;
  templatePath?: string;
}

export interface DeploymentConfig {
  configPath: string;
  backupPath?: string;
  validationSchema?: Record<string, any>;
  deploymentHooks?: {
    beforeDeploy?: () => Promise<void>;
    afterDeploy?: () => Promise<void>;
  };
}

/**
 * Configuration manager for external deployment
 */
export class ConfigManager {
  private storage: StorageManager;

  constructor(storage: StorageManager = new StorageManager()) {
    this.storage = storage;
  }

  /**
   * Generate configuration using highest-rated parameters
   */
  async generateOptimalConfiguration(
    parameterTypes: string[]
  ): Promise<Record<string, any> | null> {
    return generateOptimalConfig(parameterTypes, this.storage);
  }

  /**
   * Export configuration to file
   */
  async exportConfiguration(
    config: Record<string, any>,
    filePath: string,
    options: ConfigExportOptions = { format: 'json' }
  ): Promise<void> {
    await this.ensureDirectoryExists(dirname(filePath));

    let content: string;

    switch (options.format) {
      case 'json':
        content = this.formatAsJson(config, options.includeMetadata);
        break;
      case 'yaml':
        content = this.formatAsYaml(config, options.includeMetadata);
        break;
      case 'env':
        content = this.formatAsEnv(config);
        break;
      case 'typescript':
        content = this.formatAsTypeScript(config, options.includeMetadata);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Deploy configuration with backup and validation
   */
  async deployConfiguration(
    config: Record<string, any>,
    deploymentConfig: DeploymentConfig,
    exportOptions: ConfigExportOptions = { format: 'json' }
  ): Promise<void> {
    const { configPath, backupPath, validationSchema, deploymentHooks } = deploymentConfig;

    if (deploymentHooks?.beforeDeploy) {
      await deploymentHooks.beforeDeploy();
    }

    if (backupPath) {
      try {
        await fs.access(configPath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = backupPath.replace('{timestamp}', timestamp);
        await fs.copyFile(configPath, backupFile);
      } catch {
      }
    }

    if (validationSchema) {
      this.validateConfiguration(config, validationSchema);
    }

    await this.exportConfiguration(config, configPath, exportOptions);

    if (deploymentHooks?.afterDeploy) {
      await deploymentHooks.afterDeploy();
    }
  }

  /**
   * Create API endpoint for real-time configuration updates
   */
  createConfigurationAPI(): {
    getCurrentConfig: () => Promise<Record<string, any> | null>;
    updateConfig: (parameterTypes: string[]) => Promise<Record<string, any> | null>;
    getParameterRatings: (parameterType: string) => Promise<any[]>;
    getTopCombinations: (limit?: number) => Promise<any[]>;
  } {
    return {
      getCurrentConfig: async () => {
        const topCombinations = await this.storage.getTopCombinations(1);
        return topCombinations.length > 0 ? topCombinations[0].combination : null;
      },

      updateConfig: async (parameterTypes: string[]) => {
        return this.generateOptimalConfiguration(parameterTypes);
      },

      getParameterRatings: async (parameterType: string) => {
        return this.storage.getTopParametersByType(parameterType, 10);
      },

      getTopCombinations: async (limit = 10) => {
        return this.storage.getTopCombinations(limit);
      },
    };
  }

  /**
   * Schedule automatic configuration updates
   */
  async scheduleConfigurationUpdates(
    parameterTypes: string[],
    deploymentConfig: DeploymentConfig,
    intervalMs: number,
    exportOptions: ConfigExportOptions = { format: 'json' }
  ): Promise<NodeJS.Timeout> {
    const updateConfig = async () => {
      try {
        const optimalConfig = await this.generateOptimalConfiguration(parameterTypes);
        if (optimalConfig) {
          await this.deployConfiguration(optimalConfig, deploymentConfig, exportOptions);
        }
      } catch (error) {
        console.error('Scheduled configuration update failed:', error);
      }
    };

    await updateConfig();

    return setInterval(updateConfig, intervalMs);
  }

  /**
   * Format configuration as JSON
   */
  private formatAsJson(config: Record<string, any>, includeMetadata?: boolean): string {
    const output: any = { ...config };

    if (includeMetadata) {
      output._metadata = {
        generatedAt: new Date().toISOString(),
        source: 'ai-experiments-elo-system',
        version: '1.0.0',
      };
    }

    return JSON.stringify(output, null, 2);
  }

  /**
   * Format configuration as YAML
   */
  private formatAsYaml(config: Record<string, any>, includeMetadata?: boolean): string {
    let yaml = '';

    if (includeMetadata) {
      yaml += `# Generated by ai-experiments Elo system\n`;
      yaml += `# Generated at: ${new Date().toISOString()}\n\n`;
    }

    yaml += this.objectToYaml(config, 0);
    return yaml;
  }

  /**
   * Format configuration as environment variables
   */
  private formatAsEnv(config: Record<string, any>): string {
    const lines: string[] = [];
    
    const flatten = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = (prefix + key).toUpperCase().replace(/[^A-Z0-9]/g, '_');
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, `${prefix}${key}_`);
        } else {
          lines.push(`${envKey}=${JSON.stringify(value)}`);
        }
      }
    };

    flatten(config);
    return lines.join('\n');
  }

  /**
   * Format configuration as TypeScript
   */
  private formatAsTypeScript(config: Record<string, any>, includeMetadata?: boolean): string {
    let ts = '';

    if (includeMetadata) {
      ts += `// Generated by ai-experiments Elo system\n`;
      ts += `// Generated at: ${new Date().toISOString()}\n\n`;
    }

    ts += `export const config = ${JSON.stringify(config, null, 2)} as const;\n\n`;
    ts += `export type Config = typeof config;\n`;
    
    return ts;
  }

  /**
   * Convert object to YAML format
   */
  private objectToYaml(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}  -\n`;
            yaml += this.objectToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${JSON.stringify(item)}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return yaml;
  }

  /**
   * Validate configuration against schema
   */
  private validateConfiguration(config: Record<string, any>, schema: Record<string, any>): void {
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in config)) {
        throw new Error(`Missing required configuration key: ${key}`);
      }

      const actualType = typeof config[key];
      if (actualType !== expectedType) {
        throw new Error(`Invalid type for ${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

/**
 * Export configuration to file
 */
export async function exportConfiguration(
  config: Record<string, any>,
  filePath: string,
  options: ConfigExportOptions = { format: 'json' }
): Promise<void> {
  const manager = new ConfigManager();
  return manager.exportConfiguration(config, filePath, options);
}

/**
 * Schedule automatic evolution cycles with configuration deployment
 */
export async function scheduleEvolutionCycle(
  parameterTypes: string[],
  deploymentConfig: DeploymentConfig,
  intervalMs: number,
  exportOptions: ConfigExportOptions = { format: 'json' }
): Promise<NodeJS.Timeout> {
  const manager = new ConfigManager();
  return manager.scheduleConfigurationUpdates(
    parameterTypes,
    deploymentConfig,
    intervalMs,
    exportOptions
  );
}
