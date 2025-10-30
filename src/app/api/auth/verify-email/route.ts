import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import authService from '@/services/auth/auth.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await authService.verifyEmail(token);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    log.error('Email verification error:', { error });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 400 }
    );
  }
}
