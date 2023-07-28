import { Router, RouterContext } from 'https://deno.land/x/oak@v12.4.0/mod.ts';
import {
  requestChapterQuestions,
  requestGrade,
  requestHint,
  requestQuestionList,
} from './openAi.ts';
import { getBookNames, getChapterNames } from './supabase.ts';

export const router = new Router();

router.get('/', (ctx) => {
  console.log('Request for /');

  ctx.response.body = 'Hello world!';
});

const requestGpt = async (
  url: string,
  requestFunc: (body: unknown) => Promise<unknown>,
  ctx: RouterContext<any, any, any>
) => {
  console.log(`Request for ${url}`);

  const body =
    ctx.request.body().type === 'json'
      ? await ctx.request.body().value
      : JSON.parse(await ctx.request.body().value);

  const result = await requestFunc(body);
  if (!result) {
    ctx.response.status = 400;
    console.warn('Failed');
    return;
  }
  ctx.response.body = JSON.stringify(result);
};

router.post('/grade', async (ctx) => {
  await requestGpt('/grade', requestGrade, ctx);
});

router.post('/question-list', async (ctx) => {
  await requestGpt('/question-list', requestQuestionList, ctx);
});

router.post('/hint', async (ctx) => {
  await requestGpt('/hint', requestHint, ctx);
});

router.post('/chapter-questions', async (ctx) => {
  await requestGpt('/chapter-questions', requestChapterQuestions, ctx);
});

router.get('/bookshelf', async (ctx) => {
  ctx.response.body = JSON.stringify({ books: await getBookNames() });
});

router.get('/book/:book', async (ctx) => {
  const book = ctx.params.book;
  const chapterNames = await getChapterNames(book);
  ctx.response.body = JSON.stringify({
    chapters: chapterNames.sort(sortChapters),
  });
});

router.get('/book/:book/chapter/:chapter', async (ctx) => {
  const book = ctx.params.book;
  const chapter = ctx.params.chapter;

  const text = await Deno.readTextFile(`./assets/books/${book}/${chapter}`);
  ctx.response.body = JSON.stringify({ text });
});

const sortChapters = (a: string, b: string) => {
  const numA = a
    .split(' ')[0]
    .split('.')
    .map((x) => parseInt(x));
  const numB = b
    .split(' ')[0]
    .split('.')
    .map((x) => parseInt(x));
  for (let i = 0; i < Math.min(numA.length, numB.length); i++) {
    if (numA[i] == numB[i]) {
      continue;
    }
    return numA[i] - numB[i];
  }
  return numA.length - numB.length;
};
