import { log } from '@/lib/logger';
// Authentication Service Implementation - Part 1
import { PrismaClient } from '@prisma/client';
import _bcrypt from 'bcryptjs';
import _jwt from 'jsonwebtoken';
import _speakeasy from 'speakeasy';
import _QRCode from 'qrcode';
import { randomBytes as _randomBytes } from 'crypto';
import { addHours as _addHours, addMinutes as _addMinutes, isAfter as _isAfter } from 'date-fns';
import { Resend } from 'resend';
import twilio from 'twilio';
import { UserRole, UserStatus as _UserStatus, AuthProvider as _AuthProvider } from '@/types/auth/auth.types';

const prisma = new PrismaClient();

// Lazy initialization to prevent build-time errors
let resendInstance: any = null;
let twilioInstance: any = null;

function _getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

function _getTwilio() {
  if (!twilioInstance && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioInstance = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioInstance;
}

interface SignUpRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  businessJustification?: string;
  referralSource?: string;
  password?: string;
}
interface _ApprovalDecision {
  pendingSignUpId: string;
  approved: boolean;
  reviewNotes?: string;
  assignedRole?: UserRole;
  organizationId?: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly MAGIC_LINK_EXPIRY_MINUTES = 15;
  private readonly SESSION_EXPIRY_HOURS = 24;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  // ==================== Email Helpers ====================

  private async sendVerificationEmail(email: string, token: string) {
    const resend = _getResend();

    if (!resend) {
      log.warn('Resend not configured - skipping verification email');
      return;
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@limn.app',
        to: email,
        subject: 'Verify your email address',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #2d3748; margin-top: 0;">Verify Your Email Address</h1>
                <p style="font-size: 16px; color: #4a5568;">Thank you for signing up! Please verify your email address to complete your registration.</p>
              </div>

              <div style="padding: 20px 0;">
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 25px;">Click the button below to verify your email address:</p>

                <a href="${verificationUrl}"
                   style="display: inline-block; background-color: #4299e1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>

                <p style="font-size: 14px; color: #718096; margin-top: 25px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${verificationUrl}" style="color: #4299e1; word-break: break-all;">${verificationUrl}</a>
                </p>

                <p style="font-size: 14px; color: #718096; margin-top: 25px;">
                  This verification link will expire in 48 hours.
                </p>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      log.info(`Verification email sent to ${email}`);
    } catch (error) {
      log.error('Failed to send verification email:', { error });
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  // ==================== Sign-Up Flow ====================
  
  async requestSignUp(data: SignUpRequest) {
    // Check if user already exists
    // Note: findFirst not supported by wrapper, using findMany
    const existingUserArray = await prisma.users.findMany({
      where: { email: data.email },
      take: 1,
    });
    const existingUser = existingUserArray.length > 0 ? existingUserArray[0] : null;

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Check if pending signup already exists
    const existingPendingArray = await prisma.pending_sign_up.findMany({
      where: { email: data.email },
      take: 1,
    });
    const existingPending = existingPendingArray.length > 0 ? existingPendingArray[0] : null;

    // If pending signup exists and not expired, resend verification email
    if (existingPending && _isAfter(existingPending.expires_at, new Date())) {
      await this.sendVerificationEmail(data.email, existingPending.verification_token);
      return {
        message: 'Verification email resent. Please check your inbox.',
        pendingSignUpId: existingPending.id,
      };
    }

    // Delete expired pending signup if exists
    if (existingPending) {
      await prisma.pending_sign_up.delete({
        where: { id: existingPending.id },
      });
    }

    // Generate verification token
    const verificationToken = _randomBytes(32).toString('hex');
    const expiresAt = _addHours(new Date(), 48); // 48 hours expiry

    // Determine user type from data (default to 'customer')
    const userType = data.businessJustification ? 'business' : 'customer';

    // Create pending signup record
    const pendingSignUp = await prisma.pending_sign_up.create({
      data: {
        email: data.email,
        verification_token: verificationToken,
        expires_at: expiresAt,
        user_type: userType,
        metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          phoneNumber: data.phoneNumber,
          businessJustification: data.businessJustification,
          referralSource: data.referralSource,
        },
      },
    });

    // Send verification email
    await this.sendVerificationEmail(data.email, verificationToken);

    return {
      message: 'Verification email sent. Please check your inbox to verify your email address.',
      pendingSignUpId: pendingSignUp.id,
    };
  }
  async verifyEmail(token: string) {
    // Find pending signup by verification token
    const pendingArray = await prisma.pending_sign_up.findMany({
      where: { verification_token: token },
      take: 1,
    });
    const pending = pendingArray.length > 0 ? pendingArray[0] : null;

    if (!pending) {
      throw new Error('Invalid verification token');
    }

    // Check if token has expired
    if (_isAfter(new Date(), pending.expires_at)) {
      // Delete expired pending signup
      await prisma.pending_sign_up.delete({
        where: { id: pending.id },
      });
      throw new Error('Verification token has expired. Please sign up again.');
    }

    // Extract metadata
    const metadata = pending.metadata as any;

    // Prepare user metadata for storage
    const userName = metadata?.firstName && metadata?.lastName
      ? `${metadata.firstName} ${metadata.lastName}`
      : metadata?.firstName || pending.email.split('@')[0];

    // Create user account
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: pending.email,
        email_confirmed_at: new Date(),
        role: 'authenticated',
        phone: metadata?.phoneNumber || null,
        raw_user_meta_data: {
          name: userName,
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          companyName: metadata?.companyName,
          referralSource: metadata?.referralSource,
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Delete pending signup after successful account creation
    await prisma.pending_sign_up.delete({
      where: { id: pending.id },
    });

    return {
      message: 'Email verified successfully. Your account has been created.',
      userId: user.id,
      email: user.email,
    };
  }
}
const authServiceInstance = new AuthService();
export default authServiceInstance;

// Placeholder for additional methods - to be added
// This service contains:
// - requestSignUp() - Handle sign-up requests
// - verifyEmail() - Verify email addresses
// - getPendingSignUps() - Get pending sign-ups for admin
// - reviewSignUpRequest() - Admin approval/rejection
// - requestMagicLink() - Send magic link
// - verifyMagicLink() - Verify and sign in with magic link
// - handleGoogleCallback() - Google SSO
// - enableMFA() - Enable two-factor auth
// - verifyMFAToken() - Verify MFA code
// - createSession() - Create JWT session
// - And many helper methods...