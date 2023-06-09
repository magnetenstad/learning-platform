export {
  createOpenAIChatCompletion,
  createOpenAICompletion,
} from './connectors/OpenAI.ts';

export { llm, createLLM } from './connectors/index.ts';
export type { AnyObject, Agent, LLMCompletionFn } from './connectors/index.ts';
export {
  system,
  user,
  assistant,
  gen,
  ai,
  loop,
  map,
  wait,
} from './actions/actions.ts';
export type {
  RoleTemplateFunction,
  RoleAction,
  GenOptions,
} from './actions/actions.ts';
export {
  createAction,
  runTemplateActions,
  runActions,
  createNewContext,
} from './actions/primitives.ts';
