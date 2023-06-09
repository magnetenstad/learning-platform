import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import {
  user,
  assistant,
  gen,
  system,
  createOpenAIChatCompletion,
} from 'npm:salutejs';

config({ export: true });

const gpt3 = createOpenAIChatCompletion(
  { model: 'gpt-3.5-turbo' },
  { apiKey: Deno.env.get('OPENAI_API_KEY') }
);

const questionSchema = z.object({
  question: z.string().min(1).max(400),
  correctAnswer: z.string().min(1).max(400).optional(),
  userAnswer: z.string().min(1).max(400),
  subject: z.string(),
});

type QuestionSchema = z.infer<typeof questionSchema>;

export const requestGrade = async (body: unknown) => {
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const data = parsed.data;

  const agent = gpt3(({ params }: { params: QuestionSchema }) => [
    system`You are a concise but helpful professor in ${params.subject}. The user is one of your students and is currently taking your test. First, you will ask a question or give a statement. Second, the user will answer to their ability. Finally, you will review their answer in under 4 sentences. No subtitles.`,
    assistant`${params.question}`,
    data.correctAnswer
      ? system`The solution is ${data.correctAnswer}`
      : system`As a professer, you know the correct solution.`,
    user`${data.userAnswer}`,
    user`Grade my answer as correct, somewhat correct or incorrect. Explain any mistakes in my answer. Did I forget anything? What is important to know about to answer this question?`,
    assistant`Your answer is ${gen('correctness', {
      maxTokens: 2,
    })}. ${gen('comment', { maxTokens: 150 })}`,
  ]);

  return (await agent(data)) as { grade: string; comment: string };
};

const subjectSchema = z.object({
  subject: z.string(),
});

type SubjectSchema = z.infer<typeof subjectSchema>;

export const requestQuestionList = async (body: unknown) => {
  const parsed = subjectSchema.safeParse(body);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const data = parsed.data;
  const maxTokens = 25;
  const agent = gpt3(({ params }: { params: SubjectSchema }) => [
    user`I am studying for an exam about ${params.subject}. Generate a list of short and appropriate questions I should practice on.`,
    assistant`1) ${gen('1', { maxTokens })}\n2) ${gen('2', {
      maxTokens,
    })}\n3) ${gen('3', { maxTokens })}\n4) ${gen('4', {
      maxTokens,
    })}\n5) ${gen('5', { maxTokens })}\n6) ${gen('6', { maxTokens })}\n7) ${gen(
      '7',
      { maxTokens }
    )}\n8) ${gen('8', { maxTokens })}\n9) ${gen('9', { maxTokens })}\n10) ${gen(
      '10',
      { maxTokens }
    )}`,
  ]);
  return (await agent(data)) as {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
  };
};
