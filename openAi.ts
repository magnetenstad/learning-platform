import { OpenAI } from 'https://deno.land/x/openai@1.3.4/mod.ts';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';

const openai = new OpenAI(Deno.env.get('OPENAI_API_KEY')!);

export const performRequestWrapper = async (
  performRequest: () => Promise<{ result: string | undefined; status: number }>
) => {
  try {
    return await performRequest();
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
    return {
      result: 'An error occurred during your request.',
      status: 500,
    };
  }
};

export const requestCompletion = async (prompt: string) => {
  return await performRequestWrapper(async () => {
    const result = await openai.createCompletion({
      model: 'text-davinci-003', // $0.02 / 1K tokens
      prompt: prompt,
      temperature: 0.6,
      maxTokens: 200,
    });
    return { result: result.choices[0].text, status: 200 };
  });
};

export const requestGpt = async (prompt: string) => {
  return await performRequestWrapper(async () => {
    const result = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo', // $0.002 / 1K tokens
      temperature: 0.6,
      maxTokens: 200,
      messages: [{ role: 'system', content: prompt }],
    });
    return { result: result.choices[0].message?.content, status: 200 };
  });
};

const questionSchema = z.object({
  question: z.string().min(1).max(400),
  correctAnswer: z.string().min(1).max(400).optional(),
  userAnswer: z.string().min(1).max(400),
});

export const generateQuestionPrompt = (body: unknown) => {
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const data = parsed.data;
  const isStatement =
    data.correctAnswer?.toLowerCase() === 'true' ||
    (data.correctAnswer?.toLowerCase() === 'false' &&
      !data.question.includes('?'));

  return `Grade my answer as correct, somewhat correct or incorrect. Explain any mistakes in my answer. Did I forget anything? What is important to know about to answer this question? 
${isStatement ? 'Statement' : 'Question'}: "${data.question}"
${data.correctAnswer ? `Professor's solution: "${data.correctAnswer}"` : ''}
My answer: "${data.userAnswer}"`;
};
