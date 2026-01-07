import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prismaClient: PrismaClient | null = null;

export async function getPrismaClient(): Promise<PrismaClient> {
  if (prismaClient) {
    return prismaClient;
  }

  // Ensure database exists and migrations are applied
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Run migrations if needed (only in server environment)
    if (typeof window === 'undefined') {
      try {
        // Try to run migrations - this will create the database if it doesn't exist
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          env: { ...process.env }
        });
      } catch (error) {
        // If migrations fail, try to create the database manually
        console.warn('Migration deploy failed, database will be created on first use');
      }
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }

  prismaClient = new PrismaClient();
  return prismaClient;
}

