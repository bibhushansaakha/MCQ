'use server';

import { Question, Topic } from './types';
import { prisma } from './prisma';

export async function loadTopicsServer(): Promise<Topic[]> {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { topicId: 'asc' },
    });

    // Filter to only chapters 1-10 for chapter practice mode and sort by chapter number
    const filtered = topics
      .filter(topic => {
        if (!topic.topicId.startsWith('chapter-')) return true; // Keep non-chapter topics
        const match = topic.topicId.match(/chapter-(\d+)/);
        if (!match) return true;
        const chapterNum = parseInt(match[1], 10);
        return chapterNum >= 1 && chapterNum <= 10;
      })
      .map(topic => ({
        id: topic.topicId,
        name: topic.name,
        file: '', // Not needed anymore
        description: topic.description,
        isGeneral: topic.isGeneral,
      }));

    // Sort chapters numerically (chapter-01, chapter-02, ..., chapter-10)
    return filtered.sort((a, b) => {
      const aMatch = a.id.match(/chapter-(\d+)/);
      const bMatch = b.id.match(/chapter-(\d+)/);
      
      // If both are chapters, sort by number
      if (aMatch && bMatch) {
        return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
      }
      
      // Non-chapters come after chapters
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      
      // Both non-chapters, sort alphabetically
      return a.id.localeCompare(b.id);
    });
  } catch (error) {
    // Handle case where DATABASE_URL might not be set or database is not available
    console.error('Error loading topics from database:', error);
    return [];
  }
}

export async function loadQuestionsServer(topicId: string): Promise<Question[]> {
  const topic = await prisma.topic.findUnique({
    where: { topicId },
  });

  if (!topic) {
    throw new Error(`Topic ${topicId} not found`);
  }

  const questions = await prisma.question.findMany({
    where: { topicId },
    orderBy: { questionNumber: 'asc' },
  });

  return questions.map(q => ({
    question_number: q.questionNumber || q.questionId || 0,
    id: q.questionId || q.questionNumber || undefined,
    question: q.question,
    options: JSON.parse(q.options),
    correct_answer: q.correctAnswer,
    hint: q.hint || '',
    explanation: q.explanation || '',
    chapter: q.chapter || undefined,
    difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
    source: q.source || undefined,
  }));
}
