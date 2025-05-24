export * from './types';
export * from './render';
export * from './schema';
export * from './frontmatter';
export * from './components';

import * as types from './types';
import * as render from './render';
import * as schema from './schema';
import * as frontmatter from './frontmatter';
import * as components from './components';

const Ink = {
  ...types,
  ...render,
  ...schema,
  ...frontmatter,
  ...components
};

export default Ink;
