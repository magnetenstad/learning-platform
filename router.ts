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
