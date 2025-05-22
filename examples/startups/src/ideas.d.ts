declare module 'ideas-example/ideas' {
  interface IdeaItem {
    title: string;
    description: string;
    capabilities: string[];
    complexity: string;
    use_cases: string[];
  }

  const ideas: Record<string, IdeaItem>;
  export default ideas;
}
