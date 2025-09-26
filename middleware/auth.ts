import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options?: {
    roles?: string[];
    requireMfa?: boolean;
  }
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if session exists and is valid
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      
      const { data: session } = await supabase
        .from('auth_sessions')
        .select('*')
        .eq('user_id', decoded.userId)
        .gt('expires_at', new Date().toISOString())
        .is('revoked_at', null)
        .single();

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Check role permissions if specified
      if (options?.roles && !options.roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Add user to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      // Log API access
      await supabase.from('auth_audit_logs').insert({
        user_id: decoded.userId,
        action: 'api_access',
        details: {
          endpoint: req.url,
          method: req.method,
        },
        ip_address: req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
      });

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}