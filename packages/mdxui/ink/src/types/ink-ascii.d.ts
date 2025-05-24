declare module 'ink-ascii' {
  import { FC } from 'react';
  
  interface AsciiProps {
    text: string;
    font?: string;
  }
  
  const Ascii: FC<AsciiProps>;
  export default Ascii;
}
