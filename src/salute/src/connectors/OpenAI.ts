import { OpenAI } from 'https://deno.land/x/openai@1.3.4/mod.ts';
import { createLLM } from './index.ts';

export async function* parseOpenAIStream(
  stream: any
): AsyncGenerator<[number, string], void> {
  let content = '';
  for await (const chunk of stream) {
    content += chunk.toString();
    while (content.indexOf('\n') !== -1) {
      if (content.indexOf('\n') === -1) break;
      const nextRow = content.slice(0, content.indexOf('\n') + 1);
      content = content.slice(content.indexOf('\n') + 2);
      const data = nextRow.replace('data: ', '');

      if (data.trim() === '[DONE]') return;
      const json = JSON.parse(data);
      if (!Array.isArray(json.choices)) break;
      for (const choice of json.choices) {
        if (choice?.delta?.content)
          yield [choice.index, choice?.delta?.content.toString()];
        if (choice.text) yield [choice.index, choice.text.toString()];
      }
    }
  }
}

export const createOpenAICompletion = (options: any, apiKey: string) => {
  const openai = new OpenAI(apiKey);

  return createLLM(async function* ({ prompt, ...props }) {
    try {
      const { maxTokens, topP, stopRegex, llm, ...rest } = props;
      const response = await openai.createCompletion(
        {
          ...options,
          ...rest,
          prompt: prompt.toString(),
          top_p: topP || options.top_p,
          max_tokens: maxTokens || options.max_tokens,
          stream: props.stream || undefined,
        }
        // { responseType: props.stream ? 'stream' : undefined }
      );

      if (!props.stream) {
        for (const [i, c] of response.choices.entries()) {
          yield [i, c.text || ''];
        }
      } else {
        const stream = response;

        yield* parseOpenAIStream(stream);
      }
    } catch (e: any) {
      throw e.response;
    }
  }, false);
};

export const createOpenAIChatCompletion = (options: any, apiKey: string) => {
  const openai = new OpenAI(apiKey);

  return createLLM(async function* ({ prompt, ...props }) {
    try {
      const { maxTokens, topP, stopRegex, llm, ...rest } = props;
      const response = await openai.createChatCompletion(
        {
          ...options,
          ...rest,
          messages: prompt.toChatCompletion(),
          top_p: topP || options.top_p,
          max_tokens: maxTokens || options.max_tokens,
          stream: props.stream || undefined,
        }
        // { responseType: props.stream ? 'stream' : undefined }
      );
      if (!props.stream) {
        for (const [i, c] of response.choices.entries()) {
          yield [i, c.message?.content || ''];
        }
      } else {
        const stream = response;
        yield* parseOpenAIStream(stream);
      }
    } catch (e: any) {
      console.log(e.response);
      throw e.response;
    }
  }, true);
};
