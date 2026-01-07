'use server';

import { Question, Topic } from './types';
import { loadTopicsFromJson, loadQuestionsForTopic } from './jsonUtils';

export async function loadTopicsServer(): Promise<Topic[]> {
  try {
    return await loadTopicsFromJson();
  } catch (error) {
    console.error('Error loading topics:', error);
    return [];
  }
}

export async function loadQuestionsServer(topicId: string): Promise<Question[]> {
  try {
    const questions = await loadQuestionsForTopic(topicId);
    return questions.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
  } catch (error) {
    console.error(`Error loading questions for topic ${topicId}:`, error);
    return [];
  }
}
