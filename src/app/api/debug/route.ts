import { NextResponse } from 'next/server';
import { getEnvironmentStatus } from '@/lib/envCheck';

export async function GET() {
  try {
    const envStatus = getEnvironmentStatus();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        ...envStatus
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || String(err),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}