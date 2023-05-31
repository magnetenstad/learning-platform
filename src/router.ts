import { Router } from 'https://deno.land/x/oak@v12.4.0/mod.ts';
import {
  generateGradePrompt,
  generateQuestionListPrompt,
  requestGpt,
} from './openAi.ts';

export const router = new Router();

router.get('/', (ctx) => {
  console.log('Request for /');

  ctx.response.body = 'Hello world!';
});

router.post('/grade', async (ctx) => {
  console.log('Request for /grade');

  const body = JSON.parse(await ctx.request.body().value);

  const prompt = generateGradePrompt(body);
  if (!prompt) {
    ctx.response.status = 400;
    console.warn('Failed');
    return;
  }
  const result = await requestGpt(prompt);
  ctx.response.body = JSON.stringify({ result: result.result });
  ctx.response.status = result.status;
});

router.post('/question-list', async (ctx) => {
  console.log('Request for /question-list');

  const body = JSON.parse(await ctx.request.body().value);

  const prompt = generateQuestionListPrompt(body);
  if (!prompt) {
    ctx.response.status = 400;
    console.warn('Failed');
    return;
  }
  const result = await requestGpt(prompt);
  ctx.response.body = JSON.stringify({ result: result.result });
  ctx.response.status = result.status;
});

router.get('/bookshelf', async (ctx) => {
  const books = [];
  for await (const book of Deno.readDir('./assets/books')) {
    books.push(book.name);
  }
  ctx.response.body = JSON.stringify({ books: books });
});

router.get('/book/:book', async (ctx) => {
  const chapters = [];
  const book = ctx.params.book;

  for await (const chapter of Deno.readDir(`./assets/books/${book}`)) {
    chapters.push(chapter.name);
  }
  ctx.response.body = JSON.stringify({ chapters: chapters });
  return;
});

router.get('/book/:book/chapter/:chapter', async (ctx) => {
  const book = ctx.params.book;
  const chapter = ctx.params.chapter;

  const text = await Deno.readTextFile(`./assets/books/${book}/${chapter}`);
  ctx.response.body = JSON.stringify({ text });
  return;
});
