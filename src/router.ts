import { Router, RouterContext } from 'https://deno.land/x/oak@v12.4.0/mod.ts';
import {
  requestChapterQuestions,
  requestGrade,
  requestHint,
  requestQuestionList,
} from './openAi.ts';

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
  const books = [];
  for await (const book of Deno.readDir('./assets/books')) {
    books.push(book.name);
  }
  ctx.response.body = JSON.stringify({ books });
});

router.get('/book/:book', async (ctx) => {
  const chapters = [];
  const book = ctx.params.book;

  for await (const chapter of Deno.readDir(`./assets/books/${book}`)) {
    chapters.push(chapter.name);
  }
  ctx.response.body = JSON.stringify({ chapters });
  return;
});

router.get('/book/:book/chapter/:chapter', async (ctx) => {
  const book = ctx.params.book;
  const chapter = ctx.params.chapter;

  const text = await Deno.readTextFile(`./assets/books/${book}/${chapter}`);
  ctx.response.body = JSON.stringify({ text });
  return;
});
