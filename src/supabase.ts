import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import { Database } from './types/supabase.ts';

config({ export: true });

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  Deno.exit();
}
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getBookNames = async () => {
  const books = await supabase.storage.from('books').list();
  return books.data?.map((file) => file.name) ?? [];
};

export const getChapterNames = async (bookName: string) => {
  const chapters = await supabase.storage.from('books').list(bookName);
  return chapters.data?.map((file) => file.name) ?? [];
};

export const getChapterContent = async (
  bookName: string,
  chapterName: string
) => {
  const chapter = supabase.storage
    .from('books')
    .getPublicUrl(`${bookName}/${chapterName}`);
  chapter.data.publicUrl = chapter.data.publicUrl.replace('.md', '.txt');
  return (await (await fetch(chapter.data.publicUrl)).text()) as string;
};

export const getBook = async (bookName: string) => {
  const books = await supabase.from('books').select('*').eq('name', bookName);
  if (books.error || books.data.length != 1) {
    console.error(`Could not find book ${bookName}`);
    return null;
  }
  return books.data[0];
};

export const addBook = async (
  data: Database['public']['Tables']['books']['Insert']
) => {
  const id = crypto.randomUUID();
  const book = await supabase.from('books').insert({
    ...data,
    id,
  });
  if (book.error) {
    console.error(book.error);
    return null;
  }
  return id;
};

export const getChapter = async (bookName: string, chapterName: string) => {
  const book = await getBook(bookName);
  if (!book) return null;
  const chapters = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .eq('name', chapterName);
  if (chapters.error || chapters.data.length != 1) {
    console.error(bookName, chapterName);
    return null;
  }
  return chapters.data[0];
};

export const addChapter = async (
  data: Database['public']['Tables']['chapters']['Insert']
) => {
  const id = crypto.randomUUID();
  const chapter = await supabase.from('chapters').insert({
    ...data,
    id,
  });
  if (chapter.error) {
    console.error(chapter.error);
    return null;
  }
  return id;
};

export const getQuestions = async (chapterId: string) => {
  const questions = await supabase
    .from('questions')
    .select('*')
    .eq('chapter_id', chapterId);
  if (questions.error) {
    console.error(questions.error);
    return null;
  }
  return questions.data;
};

export const addQuestion = async (
  data: Database['public']['Tables']['questions']['Insert']
) => {
  const id = crypto.randomUUID();
  const question = await supabase.from('questions').insert({
    ...data,
    id,
  });
  if (question.error) {
    console.error(question.error);
    return null;
  }
  return id;
};
