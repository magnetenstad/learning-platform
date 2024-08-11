import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import {
  assistant,
  createOpenAIChatCompletion,
  gen,
  system,
  user,
} from './salute/src/index.ts';
import {
  addBook,
  addChapter,
  addQuestion,
  getBook,
  getChapter,
  getChapterContent,
  getQuestions,
} from './supabase.ts';

config({ export: true });

const gpt3 = createOpenAIChatCompletion(
  { model: 'gpt-3.5-turbo' },
  Deno.env.get('OPENAI_API_KEY')!
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

  const agent = gpt3(({ params }: { params: QuestionSchema }) => [
    system`You are a concise but helpful professor in ${params.subject}. The user is one of your students and is currently taking your test. First, you will ask a question or give a statement. Second, the user will answer to their ability. Finally, you will review their answer in under 4 sentences. No subtitles.`,
    assistant`${params.question}`,
    params.correctAnswer
      ? system`The solution is ${params.correctAnswer}`
      : system`As the professer, you know the correct solution.`,
    user`${params.userAnswer}`,
    user`Grade my answer as correct, somewhat correct or incorrect.`,
    assistant`Your answer is ${gen('correctness', {
      maxTokens: 2,
    })}.`,
    user`Explain any mistakes in my answer. Did I forget anything? What is important to know about to answer this question?`,
    assistant`${gen('comment', { maxTokens: 150 })}`,
  ]);

  return (await agent(parsed.data)) as { grade: string; comment: string };
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

  const maxTokens = 25;
  const agent = gpt3(({ params }: { params: SubjectSchema }) => [
    user`I am studying for an exam about ${params.subject}. Generate a list of 10 short and appropriate questions I should practice on.`,
    assistant`1) ${gen('1', { maxTokens })}\n2) ${gen('2', {
      maxTokens,
    })}\n3) ${gen('3', { maxTokens })}\n4) ${gen('4', {
      maxTokens,
    })}\n5) ${gen('5', { maxTokens })}\n6) ${gen('6', {
      maxTokens,
    })}\n7) ${gen('7', { maxTokens })}\n8) ${gen('8', {
      maxTokens,
    })}\n9) ${gen('9', { maxTokens })}\n10) ${gen('10', { maxTokens })}`,
  ]);
  return (await agent(parsed.data)) as {
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

const hintSchema = z.object({
  subject: z.string(),
  question: z.string(),
});

type HintSchema = z.infer<typeof hintSchema>;

export const requestHint = async (body: unknown) => {
  const parsed = hintSchema.safeParse(body);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const agent = gpt3(({ params }: { params: HintSchema }) => [
    system`You are a concise but helpful professor in ${params.subject}. The user is one of your students and is currently taking your test.`,
    user`Can you give me a short hint for the following question? ${params.question}Do not reveal the complete answer!`,
    assistant`${gen('hint', { maxTokens: 25 })}`,
  ]);
  return (await agent(parsed.data)) as {
    hint: string;
  };
};

const chapterSchema = z.object({
  subject: z.string(),
  book: z.string(),
  chapter: z.string(),
  text: z.string().optional(),
});

type ChapterSchema = z.infer<typeof chapterSchema>;

function chunk(text: string, size: number, max: number) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(Math.max(0, i), i + size));
    if (chunks.length == max) {
      break;
    }
  }
  return chunks;
}

export const requestChapterQuestions = async (body: unknown) => {
  const parsed = chapterSchema.safeParse(body);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  const chapter = await getChapter(parsed.data.book, parsed.data.chapter);
  if (chapter) {
    console.log('Memoized!');
    return getQuestions(chapter.id);
  }
  const book = await getBook(parsed.data.book);
  const bookId = book ? book.id : await addBook({ name: parsed.data.book });
  if (!bookId) {
    console.error('No book');
    return null;
  }
  const chapterId = await addChapter({
    book_id: bookId,
    name: parsed.data.chapter,
  });
  if (!chapterId) {
    console.error('No chapter');
    return null;
  }

  try {
    const chapterText = await getChapterContent(
      parsed.data.book,
      parsed.data.chapter
    );
    if (!chapterText) {
      return false;
    }
    const texts = chunk(
      chapterText,
      Math.min(Math.max(2000, Math.ceil(chapterText.length / 3)), 10000),
      3
    );
    const questions = await Promise.all(
      texts.map((text) => requestChapterQuestion({ ...parsed.data, text }))
    );
    questions.forEach((question) => {
      addQuestion({ ...question, chapter_id: chapterId });
    });
    return questions;
  } catch {
    return null;
  }
};

const requestChapterQuestion = async (chapter: ChapterSchema) => {
  const agent = gpt3(({ params }: { params: ChapterSchema }) => [
    system`You are a professor in ${
      params.subject
    }. Write a short paragraph that conveys the same information as the following. Write it as an original paragraph, do not reference the original. ${
      params.book
    }. \n\n ${params.text ?? ''}`,
    assistant`${gen('source', {
      maxTokens: 200,
    })}`,
    system`Create one question from chapter. Do not make it too open-ended. Do not make it too easy.`,
    assistant`${gen('question', {
      maxTokens: 25,
    })}`,
    system`State a correct answer to the question you provided, in one short incomplete sentence.`,
    assistant`${gen('correctChoice', { maxTokens: 10 })}`,
    system`State an incorrect but believable answer to the question you provided.`,
    assistant`${gen('choice2', {
      maxTokens: 10,
    })}`,
    system`State another incorrect but believable answer to the question you provided.`,
    assistant`${gen('choice3', {
      maxTokens: 10,
    })}`,
    system`State another incorrect but believable answer to the question you provided.`,
    assistant`${gen('choice4', {
      maxTokens: 10,
    })}`,
  ]);
  const result = (await agent(chapter)) as {
    source: string;
    question: string;
    correctChoice: string;
    choice2: string;
    choice3: string;
    choice4: string;
  };
  return {
    source: result.source, // chapter.text,
    question: result.question,
    choices: [
      result.correctChoice,
      result.choice2,
      result.choice3,
      result.choice4,
    ].sort(() => Math.random() - 0.5),
    correctAnswer: result.correctChoice,
  };
};
