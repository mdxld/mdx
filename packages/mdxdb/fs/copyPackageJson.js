import fs from 'fs/promises';
import path from 'path';

export async function copyPackageJson() {
  try {
    const packageJson = await fs.readFile('package.json', 'utf-8');
    const parsed = JSON.parse(packageJson);
    
    // Create a simplified version for distribution
    // Remove workspace-specific fields to avoid pnpm workspace conflicts
    const distPackageJson = {
      name: parsed.name,
      version: parsed.version,
      type: parsed.type,
      bin: parsed.bin,
      main: parsed.main,
      dependencies: parsed.dependencies,
      // Explicitly remove workspace fields
      private: undefined,
      workspaces: undefined
    };
    
    await fs.mkdir('dist', { recursive: true });
    await fs.writeFile(
      path.join('dist', 'package.json'),
      JSON.stringify(distPackageJson, null, 2)
    );
    
    console.log('✅ package.json copied to dist/ (simplified version)');
  } catch (error) {
    console.error('Error copying package.json:', error);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  copyPackageJson();
}
