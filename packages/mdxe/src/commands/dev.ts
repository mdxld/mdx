import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { findMdxFiles } from '../utils/mdx-parser';
import { findIndexFile, fileExists } from '../utils/file-utils';

/**
 * Start a development server for the MDXE project
 */
export async function runDevCommand(cwd: string = process.cwd()) {
  try {
    // Check if this is a Next.js project
    const isNextProject = await isNextJsProject(cwd);
    
    if (isNextProject) {
      console.log('📦 Detected Next.js project, starting Next.js development server...');
      return startNextDevServer(cwd);
    } else {
      console.log('⚠️ No Next.js project detected. Creating a basic Next.js setup...');
      await createBasicNextSetup(cwd);
      return startNextDevServer(cwd);
    }
  } catch (error) {
    console.error('Error starting development server:', error);
    process.exit(1);
  }
}

/**
 * Check if the directory is a Next.js project
 */
async function isNextJsProject(dir: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJsonExists = await fileExists(packageJsonPath);
    
    if (packageJsonExists) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        return true;
      }
    }
    
    const nextConfigPath = path.join(dir, 'next.config.js');
    const nextConfigExists = await fileExists(nextConfigPath);
    
    const pagesDir = path.join(dir, 'pages');
    const appDir = path.join(dir, 'app');
    const pagesDirExists = await fileExists(pagesDir);
    const appDirExists = await fileExists(appDir);
    
    return nextConfigExists || pagesDirExists || appDirExists;
  } catch (error) {
    console.error('Error checking for Next.js project:', error);
    return false;
  }
}

/**
 * Create a basic Next.js setup for MDXE
 */
export async function createBasicNextSetup(dir: string) {
  const pagesDir = path.join(dir, 'pages');
  await fs.mkdir(pagesDir, { recursive: true });
  
  const appJsPath = path.join(pagesDir, '_app.js');
  await fs.writeFile(appJsPath, `
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
  `);
  
  const stylesDir = path.join(dir, 'styles');
  await fs.mkdir(stylesDir, { recursive: true });
  
  const globalsCssPath = path.join(stylesDir, 'globals.css');
  await fs.writeFile(globalsCssPath, `
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
  `);
  
  const nextConfigPath = path.join(dir, 'next.config.js');
  await fs.writeFile(nextConfigPath, `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
}

module.exports = nextConfig
  `);
  
  const gitignorePath = path.join(dir, '.gitignore');
  if (!await fileExists(gitignorePath)) {
    await fs.writeFile(gitignorePath, `
# next.js
/.next/
/out/

# dependencies
/node_modules
/.pnp
.pnp.js

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local

# vercel
.vercel
    `);
  }
  
  console.log('✅ Basic Next.js setup created');
}

/**
 * List MDX files in the directory
 */
async function listMdxFiles(cwd: string) {
  try {
    console.log('📂 MDXE - Markdown/MDX File Browser');
    console.log(`📁 Current directory: ${cwd}`);
    console.log('');
    
    const mdxFiles = await findMdxFiles(cwd);
    const indexFile = await findIndexFile(cwd);
    
    if (mdxFiles.length > 0) {
      console.log('📄 Available MDX Files:');
      mdxFiles.forEach((file: string, index: number) => {
        console.log(`  ${index + 1}. ${path.relative(cwd, file)}`);
      });
      
      if (indexFile) {
        console.log('');
        console.log(`📝 Index file found: ${path.relative(cwd, indexFile)}`);
        const content = await fs.readFile(indexFile, 'utf-8');
        console.log('');
        console.log('--- Content Preview ---');
        console.log(content.substring(0, 500) + '...');
      }
    } else {
      console.log('⚠️ No MDX files found in this directory.');
    }
    
    console.log('');
    console.log('Press Ctrl+C to quit');
    
    return new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('Exiting MDXE file browser');
        resolve();
      });
    });
  } catch (error) {
    console.error('Error listing MDX files:', error);
    process.exit(1);
  }
}

/**
 * Start the Next.js development server
 */
function startNextDevServer(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const nextBin = path.join(cwd, 'node_modules', '.bin', 'next');
    
    fs.access(nextBin).then(() => {
      console.log('📦 Starting Next.js development server...');
      const nextProcess = spawn(nextBin, ['dev'], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });
      
      nextProcess.on('error', (error) => {
        console.error('Failed to start Next.js development server:', error);
        console.log('⚠️ Falling back to MDXE file browser...');
        listMdxFiles(cwd).then(resolve).catch(reject);
      });
      
      nextProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Next.js development server exited with code ${code}`);
          console.log('⚠️ Falling back to MDXE file browser...');
          listMdxFiles(cwd).then(resolve).catch(reject);
        } else {
          resolve();
        }
      });
    }).catch(() => {
      console.log('⚠️ Next.js not found. Using MDXE file browser instead.');
      listMdxFiles(cwd).then(resolve).catch(reject);
    });
  });
}
