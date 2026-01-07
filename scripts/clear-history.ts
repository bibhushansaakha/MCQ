import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearHistory() {
  try {
    console.log('Clearing all sessions and attempts...');
    
    // Delete all attempts first (due to foreign key constraint)
    const deletedAttempts = await prisma.attempt.deleteMany({});
    console.log(`Deleted ${deletedAttempts.count} attempts`);
    
    // Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`Deleted ${deletedSessions.count} sessions`);
    
    console.log('✅ History cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing history:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearHistory();



