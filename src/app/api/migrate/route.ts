import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not set' },
        { status: 500 }
      );
    }

    console.log('Running migrations...');
    const output: string[] = [];
    
    // Try db push first (more reliable for Vercel)
    try {
      console.log('Pushing schema to database...');
      const result = execSync('npx prisma db push --accept-data-loss --skip-generate', {
        encoding: 'utf-8',
        env: { ...process.env }
      });
      output.push(result);
      return NextResponse.json({ 
        success: true, 
        message: 'Schema pushed successfully',
        output: result
      });
    } catch (pushError: any) {
      // Fallback to migrations
      console.log('Schema push failed, trying migrations...');
      try {
        const result = execSync('npx prisma migrate deploy', {
          encoding: 'utf-8',
          env: { ...process.env }
        });
        output.push(result);
        return NextResponse.json({ 
          success: true, 
          message: 'Migrations applied successfully',
          output: result,
          warning: 'Used migrations instead of db push'
        });
      } catch (migrationError: any) {
        return NextResponse.json(
          { 
            error: 'Both db push and migrations failed', 
            details: migrationError.message,
            pushError: pushError.message,
            pushOutput: pushError.stdout || pushError.stderr || '',
            migrationOutput: migrationError.stdout || migrationError.stderr || ''
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to run migrations',
    usage: 'POST /api/migrate'
  });
}

