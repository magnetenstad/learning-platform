import { Router } from 'https://deno.land/x/oak@v12.4.0/mod.ts';
import { generateQuestionPrompt, requestGpt } from './openAi.ts';

export const router = new Router();

router.get('/', (ctx) => {
  console.log('Request for /');

  ctx.response.body = 'Hello world!';
});

router.post('/question', async (ctx) => {
  console.log('Request for /question');

  const body = JSON.parse(await ctx.request.body().value);

  const prompt = generateQuestionPrompt(body);
  if (!prompt) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: {
        message: 'Please provide question, correctAnswer and userAnswer',
      },
    };
    console.warn('Failed');
    return;
  }
  const result = await requestGpt(prompt);
  ctx.response.body = JSON.stringify({ result: result.result });
  ctx.response.status = result.status;
});
