import { log } from '@/lib/logger';
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';

const signinSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  magicToken: z.string().optional(),
  mfaCode: z.string().optional(),
  method: z.enum(['password', 'magic-link', 'google', 'microsoft']),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = signinSchema.parse(req.body);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let user;

    // Handle different auth methods
    switch (body.method) {
      case 'password':
        const { data: passwordUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', body.email)
          .single();

        if (!passwordUser) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is locked
        if (passwordUser.lockout_until && 
            new Date(passwordUser.lockout_until) > new Date()) {
          return res.status(423).json({ error: 'Account temporarily locked' });
        }

        // Verify password (in production, use Supabase Auth)
        user = passwordUser;
        break;

      case 'magic-link':
        const { data: magicLink } = await supabase
          .from('magic_link_tokens')
          .select('*')
          .eq('email', body.email)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!magicLink) {
          return res.status(401).json({ error: 'Invalid or expired magic link' });
        }

        const tokenValid = await bcrypt.compare(
          body.magicToken!, 
          magicLink.token_hash
        );
        
        if (!tokenValid) {
          return res.status(401).json({ error: 'Invalid magic link' });
        }

        // Mark magic link as used
        await supabase
          .from('magic_link_tokens')
          .update({ used: true })
          .eq('id', magicLink.id);

        // Get user
        const { data: magicUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', body.email)
          .single();

        user = magicUser;
        break;
      case 'google':
      case 'microsoft':
        // OAuth flow placeholder
        return res.status(501).json({ error: 'OAuth not yet implemented' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ 
        error: `Account ${user.status}. Please wait for admin approval.` 
      });
    }

    // Check MFA if enabled
    if (user.mfa_enabled && !body.mfaCode) {
      return res.status(200).json({ 
        requireMfa: true,
        userId: user.id 
      });
    }

    if (user.mfa_enabled && body.mfaCode) {
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: body.mfaCode,
        window: 2,      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    // Generate session tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Store session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token_hash: await bcrypt.hash(accessToken, 10),
        refresh_token_hash: await bcrypt.hash(refreshToken, 10),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        device_info: {
          userAgent: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform'],
        },
        ip_address: req.socket.remoteAddress,
      });

    if (sessionError) throw sessionError;

    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        failed_login_attempts: 0,
      })
      .eq('id', user.id);

    // Log audit event
    await supabase.from('admin_audit_log').insert({
      user_id: user.id,
      action: 'signin',
      details: { method: body.method },
      ip_address: req.socket.remoteAddress,
      user_agent: req.headers['user-agent'],
      success: true,
    });

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,        fullName: user.full_name,
        role: user.role,
        avatar: user.avatar_url,
      },
    });
  } catch (error) {
    log.error('Signin error:', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}