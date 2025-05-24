import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';

async function findIndexFile(dir) {
  const possibleFiles = [
    path.join(dir, 'README.md'),
    path.join(dir, 'readme.md'),
    path.join(dir, 'index.md'),
    path.join(dir, 'index.mdx'),
    path.join(dir, 'page.md'),
    path.join(dir, 'page.mdx')
  ];

  for (const file of possibleFiles) {
    try {
      await fs.promises.access(file);
      return file;
    } catch {
    }
  }

  return null;
}

export default async function handler(req, res) {
  try {
    const { path: requestPath } = req.query;
    const rootDir = process.cwd();
    
    let filePath;
    
    if (requestPath === '/') {
      filePath = await findIndexFile(rootDir);
      if (!filePath) {
        return res.status(404).json({ error: 'No index file found' });
      }
    } else {
      const fullPath = path.join(rootDir, requestPath);
      
      try {
        const stat = await fs.promises.stat(fullPath);
        
        if (stat.isDirectory()) {
          filePath = await findIndexFile(fullPath);
          if (!filePath) {
            return res.status(404).json({ error: `No index file found in ${requestPath}` });
          }
        } else if (fullPath.endsWith('.md') || fullPath.endsWith('.mdx')) {
          filePath = fullPath;
        } else {
          return res.status(400).json({ error: 'Invalid file type' });
        }
      } catch (err) {
        return res.status(404).json({ error: `Path not found: ${requestPath}` });
      }
    }
    
    const source = await fs.promises.readFile(filePath, 'utf-8');
    
    const htmlContent = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(source);
    
    return res.status(200).json({ 
      htmlContent: String(htmlContent),
      filePath: filePath.replace(rootDir, '')
    });
  } catch (error) {
    console.error('Error processing markdown:', error);
    return res.status(500).json({ error: 'Error processing markdown content' });
  }
}
