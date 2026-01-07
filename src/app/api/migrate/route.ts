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

    // Generate Prisma client first
    try {
      console.log('Generating Prisma client...');
      execSync('npx prisma generate', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });
    } catch (genError: any) {
      console.warn('Prisma generate warning:', genError.message);
    }

    const errors: any[] = [];
    
    // Try db push first
    try {
      console.log('Pushing schema to database...');
      const result = execSync('npx prisma db push --accept-data-loss --skip-generate', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      return NextResponse.json({ 
        success: true, 
        message: 'Schema pushed successfully',
        output: result
      });
    } catch (pushError: any) {
      const pushStdout = pushError.stdout?.toString() || '';
      const pushStderr = pushError.stderr?.toString() || '';
      errors.push({
        method: 'db push',
        error: pushError.message,
        stdout: pushStdout,
        stderr: pushStderr,
      });
      
      // Try migrations
      try {
        console.log('Trying migrations...');
        const result = execSync('npx prisma migrate deploy', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env }
        });
        return NextResponse.json({ 
          success: true, 
          message: 'Migrations applied successfully',
          output: result,
          warning: 'Used migrations instead of db push'
        });
      } catch (migrationError: any) {
        const migrationStdout = migrationError.stdout?.toString() || '';
        const migrationStderr = migrationError.stderr?.toString() || '';
        errors.push({
          method: 'migrate deploy',
          error: migrationError.message,
          stdout: migrationStdout,
          stderr: migrationStderr,
        });
        
        return NextResponse.json(
          { 
            error: 'Both db push and migrations failed', 
            errors: errors,
            databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
            suggestion: 'Try using /api/create-tables endpoint to create tables directly'
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

