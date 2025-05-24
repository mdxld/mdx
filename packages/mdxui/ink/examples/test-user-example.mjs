import { renderMdxCli } from '../dist/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdxPath = path.join(__dirname, 'direct-jsx-example.mdx');

async function main() {
  try {
    console.log('Testing user-requested direct JSX example...');
    const result = await renderMdxCli(mdxPath, {
      scope: {
        name: 'test-project',
        os: 'Ubuntu',
        memory: 1024,
        region: 'sfo'
      }
    });
    
    console.log('Result:', result);
    console.log('✅ User-requested direct JSX example test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing user-requested direct JSX example:', error);
    console.error(error);
  }
}

main();
