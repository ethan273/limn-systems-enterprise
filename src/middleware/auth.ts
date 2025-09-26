// Authentication Middleware
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Verify JWT token and return user information
 */
export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as DecodedToken;
    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return null;
    }

    // Verify user still exists
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email || '',
      role: user.role || ''
    };
  } catch (error) {
    return null;
  }
}
/**
 * Extract and verify auth token from request
 */
export async function requireAuth(
  req: NextRequest,
  requiredRoles?: string[]
): Promise<AuthenticatedUser> {
  // Get token from cookie or Authorization header
  const token = req.cookies.get('auth-token')?.value ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw { 
      status: 401, 
      message: 'Authentication required' 
    };
  }

  const user = await verifyToken(token);

  if (!user) {
    throw { 
      status: 401, 
      message: 'Invalid or expired token' 
    };
  }
  // Check role permissions if required
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      throw { 
        status: 403, 
        message: 'Insufficient permissions' 
      };
    }
  }

  return user;
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireAuth(req);
      return await handler(req, user);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: error.status || 500 }
      );
    }
  };
}