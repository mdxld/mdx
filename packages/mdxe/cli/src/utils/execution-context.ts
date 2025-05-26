/**
 * Execution context for MDXE
 * Provides global objects and functions for MDX code blocks
 */

import { on, emit, EventContext } from './event-system';
import { renderInputPrompt } from './input-prompt';

/**
 * Create an execution context with global objects for MDX code blocks
 * @returns Object with global objects and functions
 */
export function createExecutionContext() {
  return {
    /**
     * Register a callback for a specific event
     * Special handling for 'idea.captured' event to prompt for user input
     * Supports context propagation between handlers
     */
    on: async (event: string, callback: (data: any, context?: EventContext) => any) => {
      if (event === 'idea.captured') {
        const idea = await renderInputPrompt('Enter your startup idea:');
        return callback(idea, { eventType: 'idea.captured', timestamp: new Date().toISOString() });
      }
      on(event, callback);
    },

    /**
     * Placeholder for AI functions
     * Will be implemented in future versions
     */
    ai: {
      async(strings: TemplateStringsArray, ...values: any[]) {
        console.log('AI function called with:', strings, values);
        return 'AI response placeholder';
      },
      
      async generate(prompt: string) {
        console.log('AI generate called with:', prompt);
        return 'Generated content placeholder';
      },
      
      leanCanvas: async (params: any) => {
        console.log('AI leanCanvas called with:', params);
        return { /* Lean Canvas placeholder */ };
      },
      
      storyBrand: async (params: any) => {
        console.log('AI storyBrand called with:', params);
        return { /* StoryBrand placeholder */ };
      },
      
      landingPage: async (params: any) => {
        console.log('AI landingPage called with:', params);
        return { /* Landing Page placeholder */ };
      }
    },

    /**
     * Placeholder for database functions
     * Will be implemented in future versions
     */
    db: {
      blog: {
        create: (title: string, content: string) => {
          console.log('DB blog.create called with:', { title, content });
          return { id: 'placeholder-id', title, content };
        }
      }
    },

    /**
     * Placeholder for list generation function
     * Will be implemented in future versions
     */
    list: async function(strings: TemplateStringsArray, ...values: any[]) {
      console.log('List function called with:', strings, values);
      return ['Item 1', 'Item 2', 'Item 3'];
    },

    /**
     * Placeholder for research function
     * Will be implemented in future versions
     */
    research: async function(strings: TemplateStringsArray, ...values: any[]) {
      console.log('Research function called with:', strings, values);
      return 'Research results placeholder';
    },

    /**
     * Placeholder for extract function
     * Will be implemented in future versions
     */
    extract: async function(strings: TemplateStringsArray, ...values: any[]) {
      console.log('Extract function called with:', strings, values);
      return ['Extracted item 1', 'Extracted item 2'];
    }
  };
}
