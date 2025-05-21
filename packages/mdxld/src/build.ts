import { build as veliteBuild, type Options } from 'velite';
import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { compileMdx } from './bundler.js';
import { parseFrontmatter } from './parser.js';

export interface BuildOptions {
  sourceDir: string;
  outputDir: string;
  configFile?: string;
  watch?: boolean;
  bundle?: boolean;
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
  }
}

export async function build(options: BuildOptions): Promise<void> {
  const { sourceDir, outputDir, configFile, watch = false, bundle = false } = options;
  
  await ensureDir(outputDir);
  
  const defaultConfig = {
    root: process.cwd(),
    output: {
      dir: outputDir,
      mdx: true,
    },
    content: {
      files: {
        pattern: `${sourceDir}/**/*(md|mdx)`,
        schema: (s: any) => ({
          title: s.string(),
          description: s.string().optional(),
          raw: s.mdx(),
          code: s.mdx({
            mdxOptions: {
              jsx: true,
              format: 'mdx',
            },
          }),
        }),
      },
    },
  };
  
  try {
    let tempConfigFile: string | undefined = configFile;
    if (!configFile) {
      tempConfigFile = join(process.cwd(), '.velite.temp.js');
      const configContent = `export default ${JSON.stringify(defaultConfig, null, 2)}`;
      await fs.writeFile(tempConfigFile, configContent, 'utf-8');
    }
    
    const buildOptions: Options = {
      config: tempConfigFile,
      watch: watch,
      clean: true,
    };
    
    const result = await veliteBuild(buildOptions);
    
    console.log('mdxld: Velite build successful');
    
    if (bundle && result) {
      console.log('mdxld: Bundling MDX files with esbuild...');
      const files = Array.isArray(result.files) ? result.files : [];
      
      for (const file of files) {
        try {
          const mdxCode = file.code;
          const bundledCode = await compileMdx(mdxCode);
          
          const outputPath = join(outputDir, file.path.replace(/\.(md|mdx)$/, '.js'));
          await ensureDir(dirname(outputPath));
          await fs.writeFile(outputPath, bundledCode, 'utf-8');
          
          console.log(`mdxld: Bundled ${file.path} to ${outputPath}`);
        } catch (error) {
          console.error(`mdxld: Error bundling ${file.path}:`, error);
        }
      }
    }
    
    if (!configFile && tempConfigFile) {
      try {
        await fs.unlink(tempConfigFile);
      } catch (err) {
        console.warn('mdxld: Failed to clean up temporary config file:', err);
      }
    }
    
  } catch (error) {
    console.error('mdxld: Build error:', error);
    throw error;
  }
}
