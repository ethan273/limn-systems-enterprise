// Sign-Up API Route
// app/api/auth/sign-up/route.ts

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/services/auth/auth.service';
import { z } from 'zod';

const SignUpSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  businessJustification: z.string().optional(),
  referralSource: z.string().optional(),
  password: z.string().min(8).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SignUpSchema.parse(body);
    
    const result = await authService.requestSignUp(validated);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Sign-up request failed' },
      { status: error.message?.includes('already') ? 409 : 500 }
    );
  }
}