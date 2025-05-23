declare module 'dedent' {
  function dedent(strings: TemplateStringsArray, ...values: any[]): string;
  function dedent(string: string): string;
  export default dedent;
}
