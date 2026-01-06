'use server';

import { QuestionData, TopicsData, Topic, ChapterQuestionData } from './types';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Server-side file reading utilities
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const fullPath = join(process.cwd(), 'public', filePath);
  const fileContents = await readFile(fullPath, 'utf8');
  return JSON.parse(fileContents) as T;
}

export async function loadTopicsServer(): Promise<Topic[]> {
  const data = await readJsonFile<TopicsData>('data/topics.json');
  return data.topics;
}

