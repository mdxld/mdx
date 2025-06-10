import path from 'path'

const defaultComponents = {
  h1: (props) => <h1 className="text-4xl font-bold mb-6" {...props} />,
  h2: (props) => <h2 className="text-3xl font-semibold mb-4" {...props} />,
  h3: (props) => <h3 className="text-2xl font-medium mb-3" {...props} />,
  p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
  code: (props) => <code className="bg-gray-100 px-2 py-1 rounded text-sm" {...props} />,
  pre: (props) => <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-blue-500 pl-4 italic mb-4" {...props} />,
  ul: (props) => <ul className="list-disc list-inside mb-4" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside mb-4" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  a: (props) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
}

function loadUserComponents() {
  try {
    const projectRoot = process.env.MDXE_PROJECT_ROOT || process.cwd()
    const userComponentsPath = path.join(projectRoot, 'mdx-components.js')
    
    return {}
  } catch (error) {
    console.log('No user MDX components found, using defaults')
    return {}
  }
}

export function useMDXComponents(components = {}) {
  const userComponents = loadUserComponents()
  
  return {
    ...defaultComponents,
    ...userComponents,
    ...components,
  }
}
