import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function updateTopicNames() {
  try {
    console.log('🔄 Updating topic names from topics.json...\n');

    // Load topics.json
    const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
    const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));

    let updatedCount = 0;
    let createdCount = 0;

    // Update all topics to match topics.json
    for (const topic of topicsData.topics) {
      const existing = await prisma.topic.findUnique({
        where: { topicId: topic.id },
      });

      if (existing) {
        // Update existing topic
        await prisma.topic.update({
          where: { topicId: topic.id },
          data: {
            name: topic.name,
            description: topic.description,
            isGeneral: topic.isGeneral || false,
          },
        });
        console.log(`✓ Updated: ${topic.id} -> "${topic.name}"`);
        updatedCount++;
      } else {
        // Create new topic if it doesn't exist
        await prisma.topic.create({
          data: {
            topicId: topic.id,
            name: topic.name,
            description: topic.description,
            isGeneral: topic.isGeneral || false,
          },
        });
        console.log(`✓ Created: ${topic.id} -> "${topic.name}"`);
        createdCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} topics and created ${createdCount} new topics!`);
  } catch (error) {
    console.error('❌ Error updating topic names:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTopicNames();



