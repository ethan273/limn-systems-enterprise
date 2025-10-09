import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    // Find session with this refresh token
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', decoded.userId)
      .is('revoked_at', null)
      .single();

    if (!sessions) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.status !== 'approved') {
      return res.status(401).json({ error: 'User not authorized' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Update session with new token
    await supabase
      .from('sessions')
      .update({
        token_hash: await bcrypt.hash(newAccessToken, 10),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .eq('id', sessions.id);

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatar: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    return res.status(500).json({ error: 'Token refresh failed' });
  }
}