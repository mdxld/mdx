import { CoreMessage, StreamTextResult, streamText } from 'ai';
import { openai } from '@ai-sdk/openai'; // OpenAI type removed

interface LLMServiceParams {
  modelProvider?: typeof openai; // Changed to typeof openai
  modelId?: string;
  messages: CoreMessage[];
}

export async function generateContentStream(
  params: LLMServiceParams
): Promise<StreamTextResult<never, string>> { // Changed to StreamTextResult<never, string>
  const {
    modelProvider = openai, // Default to imported openai instance
    modelId = 'gpt-4o',     // Default model
    messages,
  } = params;

  try {
    // The modelProvider is already an initialized OpenAI client if it's the default 'openai'
    // If a different provider instance is passed, it should also be pre-initialized.
    // The modelId is used to specify which model to use with that provider.
    const model = modelProvider(modelId as any); // The 'as any' cast is to satisfy the generic signature of OpenAI

    const result = await streamText({
      model: model,
      messages: messages,
    });
    return result;
  } catch (error) {
    console.error("Error calling LLM service:", error);
    throw error; // Re-throwing to be caught by CLI command handlers
  }
}
