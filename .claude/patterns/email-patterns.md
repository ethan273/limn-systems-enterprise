# Email Campaign System Patterns

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Production Status

**Status**: ✅ PRODUCTION READY (October 26, 2025)
**Compliance**: CAN-SPAM Act compliant
**Security**: Rate limiting, webhook verification, PII redaction
**Monitoring**: Sentry error tracking, email event webhooks
**Backups**: Automated daily database backups

---

## Email Campaign System Architecture

### Core Components

1. **Email Queue System** - Asynchronous email processing
2. **Campaign Management** - Create, schedule, send campaigns
3. **Webhook Integration** - Real-time email event tracking
4. **Unsubscribe System** - CAN-SPAM compliant opt-out
5. **Rate Limiting** - API abuse prevention
6. **Error Monitoring** - Sentry with PII redaction
7. **Database Backups** - Daily automated backups

---

## Pattern 1: Email Queue Processing

### ✅ CORRECT Pattern

```typescript
import { EmailCampaignService } from '@/lib/services/email-campaign-service';
import { db } from '@/lib/db';

// Queue emails for campaign
const service = new EmailCampaignService(db);

const campaign = await service.create({
  name: 'Newsletter',
  subject: 'Monthly Update',
  html_content: '<p>Content here</p>',
  sender_email: 'news@company.com',
  sender_name: 'Company News',
  scheduled_for: new Date('2025-11-01T10:00:00Z'),
  status: 'scheduled',
});

// Emails are automatically queued and sent via cron job
```

**Key Points**:
- Uses `EmailCampaignService` for all email operations
- Automatically generates unsubscribe tokens
- Checks unsubscribe list before queueing
- Injects unsubscribe footer into HTML content
- Rate limiting applied via tRPC middleware

---

## Pattern 2: Scheduled Campaign Sending

### Vercel Cron Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Cron Endpoint**: `src/app/api/cron/process-scheduled-campaigns/route.ts`

```typescript
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find campaigns scheduled for now
    const now = new Date();
    const scheduledCampaigns = await db.email_campaigns.findMany({
      where: {
        status: 'scheduled',
        scheduled_for: { lte: now },
      },
      orderBy: { scheduled_for: 'asc' },
    });

    // Process each campaign
    const service = new EmailCampaignService(db);
    const results = [];

    for (const campaign of scheduledCampaigns) {
      try {
        const result = await service.send(campaign.id);
        results.push({ campaign_id: campaign.id, success: true, sent_count: result.sent_count });
      } catch (error) {
        results.push({ campaign_id: campaign.id, success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      results,
    });
  } catch (error) {
    console.error('[cron:scheduled-campaigns]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**Environment Variable**:
```bash
CRON_SECRET=your-secure-random-string-here
```

---

## Pattern 3: Email Webhook Integration

### Resend Webhook Handler

**File**: `src/app/api/webhooks/resend/route.ts`

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Get webhook signature headers
    const body = await request.text();
    const headersList = await headers();
    const svixId = headersList.get('svix-id');
    const svixTimestamp = headersList.get('svix-timestamp');
    const svixSignature = headersList.get('svix-signature');

    // Verify webhook signature
    if (!process.env.RESEND_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
    const event = webhook.verify(body, {
      'svix-id': svixId!,
      'svix-timestamp': svixTimestamp!,
      'svix-signature': svixSignature!,
    }) as ResendWebhookEvent;

    // Map event type
    const eventType = mapResendEventType(event.type);
    if (!eventType) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Track event in database
    const trackingEvent = await db.email_tracking.create({
      data: {
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        event_type: eventType,
        event_data: { link_url: event.data.link },
        ip_address: event.data.ip ?? null,
        user_agent: event.data.user_agent ?? null,
      },
    });

    // Update campaign metrics
    if (campaignId && eventType !== 'sent') {
      await db.email_campaigns.update({
        where: { id: campaignId },
        data: { [fieldMap[eventType]]: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, event_id: trackingEvent.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**Environment Variables**:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Event Types Tracked**:
- `email.sent` → `sent`
- `email.delivered` → `delivered`
- `email.opened` → `opened`
- `email.clicked` → `clicked`
- `email.bounced` → `bounced`
- `email.complained` → `complained`

---

## Pattern 4: Unsubscribe System (CAN-SPAM Compliance)

### Database Schema

**Table**: `email_unsubscribes`

```prisma
model email_unsubscribes {
  id               String    @id @default(dbgenerated("gen_random_uuid()"))
  email            String    @unique @db.VarChar(255)
  reason           String?   @db.VarChar(100)
  unsubscribed_at  DateTime? @default(now()) @db.Timestamptz(6)
  campaign_id      String?   @db.Uuid
  metadata         Json?     @default("{}")

  @@index([email], map: "idx_email_unsubscribes_email")
  @@schema("public")
}
```

### Unsubscribe Token Generation

**Service**: `src/lib/services/email-service.ts`

```typescript
async queueEmail(input: CreateEmailQueueInput): Promise<string> {
  // 1. Check if email is unsubscribed
  const unsubscribed = await this.db.email_unsubscribes.findUnique({
    where: { email: input.recipient_email },
  });

  if (unsubscribed) {
    throw new Error(`Email address is unsubscribed: ${input.recipient_email}`);
  }

  // 2. Generate unsubscribe token
  const unsubscribeToken = crypto.randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
  const unsubscribeLink = `${baseUrl}/unsubscribe/${unsubscribeToken}`;

  // 3. Inject unsubscribe footer
  let htmlContent = input.html_content ?? '';
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        <a href="${unsubscribeLink}">unsubscribe here</a>.
      </p>
    </div>
  `;

  if (htmlContent.includes('</body>')) {
    htmlContent = htmlContent.replace('</body>', `${unsubscribeFooter}</body>`);
  } else {
    htmlContent += unsubscribeFooter;
  }

  // 4. Queue email with token
  const queued = await this.db.email_queue.create({
    data: {
      campaign_id: input.campaign_id ?? null,
      unsubscribe_token: unsubscribeToken,
      html_content: htmlContent,
      // ... other fields
    },
  });

  return queued.id;
}
```

### Unsubscribe Page

**File**: `src/app/unsubscribe/[token]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/utils/api';

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;
  const [success, setSuccess] = useState(false);

  const unsubscribeMutation = api.emailCampaigns.unsubscribe.useMutation({
    onSuccess: () => setSuccess(true),
  });

  const handleUnsubscribe = () => {
    unsubscribeMutation.mutate({ token });
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <CardTitle>Successfully Unsubscribed</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unsubscribe from Emails</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUnsubscribe} variant="destructive">
          Unsubscribe
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Unsubscribe tRPC Endpoint

**Router**: `src/server/api/routers/emailCampaigns.ts`

```typescript
unsubscribe: publicProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // Find email by token
    const queueItem = await ctx.db.email_queue.findUnique({
      where: { unsubscribe_token: input.token },
    });

    if (!queueItem) {
      throw new Error('Invalid unsubscribe token');
    }

    // Check if already unsubscribed
    const existing = await ctx.db.email_unsubscribes.findUnique({
      where: { email: queueItem.recipient_email },
    });

    if (existing) {
      return { success: true, message: 'Email already unsubscribed' };
    }

    // Track unsubscribe event
    await ctx.db.email_tracking.create({
      data: {
        campaign_id: queueItem.campaign_id,
        recipient_email: queueItem.recipient_email,
        event_type: 'unsubscribed',
      },
    });

    // Add to unsubscribe list
    await ctx.db.email_unsubscribes.create({
      data: {
        email: queueItem.recipient_email,
        reason: 'user_request',
        campaign_id: queueItem.campaign_id,
      },
    });

    // Update campaign metrics
    if (queueItem.campaign_id) {
      await ctx.db.email_campaigns.update({
        where: { id: queueItem.campaign_id },
        data: { unsubscribe_count: { increment: 1 } },
      });
    }

    return { success: true, message: 'Successfully unsubscribed' };
  }),
```

---

## Pattern 5: Rate Limiting

### Upstash Redis Configuration

**File**: `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit configurations
export const RATE_LIMITS = {
  API_GENERAL: { requests: 100, window: '1 m' },
  EMAIL_SEND: { requests: 10, window: '1 m' },
  CAMPAIGN_OPS: { requests: 20, window: '1 h' },
  PUBLIC_ENDPOINTS: { requests: 20, window: '1 m' },
} as const;

// Create Redis client with fallback
function createRedisClient() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('[rate-limit] Redis not configured, using in-memory');
    return null;
  }

  return new Redis({ url: redisUrl, token: redisToken });
}

const redis = createRedisClient();

// Rate limiters
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.API_GENERAL.requests,
        RATE_LIMITS.API_GENERAL.window
      ),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null;

export const emailRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.EMAIL_SEND.requests,
        RATE_LIMITS.EMAIL_SEND.window
      ),
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : null;

// Check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
) {
  if (!limiter) {
    console.warn('[rate-limit] Rate limiting bypassed');
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

### tRPC Rate Limiting Middleware

**File**: `src/server/api/trpc/init.ts`

```typescript
import { apiRateLimit, emailRateLimit, checkRateLimit } from '@/lib/rate-limit';

// General API rate limit
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) return next();

  const identifier = ctx.session.user.id;
  const result = await checkRateLimit(apiRateLimit, identifier);

  if (!result.success) {
    const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
    });
  }

  return next();
});

// Email-specific rate limit
const emailRateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) return next();

  const identifier = ctx.session.user.id;
  const result = await checkRateLimit(emailRateLimit, identifier);

  if (!result.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Email rate limit exceeded. Please try again later.',
    });
  }

  return next();
});

// Export rate-limited procedures
export const rateLimitedProcedure = protectedProcedure.use(rateLimitMiddleware);
export const emailRateLimitedProcedure = protectedProcedure.use(emailRateLimitMiddleware);
```

### Applying Rate Limits

**Router**: `src/server/api/routers/emailCampaigns.ts`

```typescript
import { emailRateLimitedProcedure, campaignRateLimitedProcedure } from '../trpc/init';

export const emailCampaignsRouter = createTRPCRouter({
  // Campaign creation: 20 requests per hour
  create: campaignRateLimitedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.create(input);
    }),

  // Email sending: 10 requests per minute
  send: emailRateLimitedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.send(input.id);
    }),
});
```

### Middleware Rate Limiting

**File**: `src/middleware.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';

// Webhook rate limiting
const webhookLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'ratelimit:webhook',
    })
  : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit webhooks
  if (pathname.startsWith('/api/webhooks/')) {
    if (webhookLimiter) {
      const identifier =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'anonymous';

      const result = await webhookLimiter.limit(identifier);

      if (!result.success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        });
      }
    }
  }

  return NextResponse.next();
}
```

**Environment Variables**:
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Pattern 6: Error Monitoring (Sentry)

### Sentry Configuration with PII Redaction

**File**: `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  maxBreadcrumbs: 50,
  attachStacktrace: true,

  // Filter out expected errors
  ignoreErrors: [
    'Too Many Requests',
    'Rate limit exceeded',
    'UNAUTHORIZED',
    'Authentication required',
    'Network request failed',
  ],

  // PII redaction
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }

    // Redact email addresses from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL_REDACTED]'
          );
        }
        return breadcrumb;
      });
    }

    return event;
  },

  integrations: [
    Sentry.prismaIntegration(),
  ],
});
```

**Environment Variable**:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## Pattern 7: Database Backups

### Automated Backup Script

**File**: `scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

BACKUP_DIR="/Users/eko3/limn-systems-enterprise-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="limn_db_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Source credentials
source /Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env

# Create backup
pg_dump "${PROD_DB_URL}" > "${BACKUP_DIR}/${BACKUP_FILE}"
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3 (optional)
if [ -n "${AWS_BACKUP_BUCKET}" ]; then
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" "s3://${AWS_BACKUP_BUCKET}/database-backups/"
fi

# Cleanup old backups
find "${BACKUP_DIR}" -name "limn_db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
```

**Cron Schedule**:
```bash
# Daily at 2 AM UTC
0 2 * * * /Users/eko3/limn-systems-enterprise/scripts/backup-database.sh
```

---

## Enforcement Rules

### Email Campaign System

1. **ALWAYS** use `EmailCampaignService` for all email operations
2. **ALWAYS** check unsubscribe list before queueing emails
3. **ALWAYS** generate unique unsubscribe tokens
4. **ALWAYS** inject unsubscribe footer into HTML content
5. **NEVER** send emails without unsubscribe link (CAN-SPAM violation)

### Webhook Security

1. **ALWAYS** verify webhook signatures using Svix
2. **ALWAYS** validate webhook secret exists before processing
3. **ALWAYS** use `await headers()` (not `headers()`) in App Router
4. **NEVER** trust webhook data without signature verification

### Rate Limiting

1. **ALWAYS** apply rate limits to email operations
2. **ALWAYS** use appropriate rate limit for operation type
3. **ALWAYS** provide graceful fallback when Redis unavailable
4. **NEVER** bypass rate limiting in production

### Error Monitoring

1. **ALWAYS** redact PII from error logs
2. **ALWAYS** filter out expected errors (rate limits, auth failures)
3. **ALWAYS** use reduced sample rate in production (10%)
4. **NEVER** log sensitive data (passwords, tokens, emails)

### Database Backups

1. **ALWAYS** run automated backups daily
2. **ALWAYS** compress backups to save space
3. **ALWAYS** maintain 30-day retention
4. **ALWAYS** test backup restoration monthly

---

## Common Pitfalls

### ❌ WRONG: Using headers() without await

```typescript
const headersList = headers(); // ❌ Error in Next.js App Router
```

### ✅ CORRECT: Await headers()

```typescript
const headersList = await headers(); // ✅ Correct
```

---

### ❌ WRONG: Sending email without unsubscribe link

```typescript
await resend.emails.send({
  to: recipient,
  subject: 'Newsletter',
  html: '<p>Content</p>', // ❌ No unsubscribe link
});
```

### ✅ CORRECT: Using EmailCampaignService

```typescript
const service = new EmailCampaignService(db);
await service.queueEmail({
  recipient_email: recipient,
  subject: 'Newsletter',
  html_content: '<p>Content</p>', // ✅ Unsubscribe link auto-injected
});
```

---

### ❌ WRONG: No webhook signature verification

```typescript
export async function POST(request: Request) {
  const event = await request.json(); // ❌ Trusting unverified data
  await processEvent(event);
}
```

### ✅ CORRECT: Verify webhook signature

```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();

  const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
  const event = webhook.verify(body, {
    'svix-id': headersList.get('svix-id')!,
    'svix-timestamp': headersList.get('svix-timestamp')!,
    'svix-signature': headersList.get('svix-signature')!,
  }); // ✅ Cryptographically verified

  await processEvent(event);
}
```

---

## Quick Reference

### Environment Variables Checklist

```bash
# Email
✅ RESEND_API_KEY
✅ RESEND_WEBHOOK_SECRET
✅ NEXT_PUBLIC_URL

# Rate Limiting
✅ UPSTASH_REDIS_REST_URL
✅ UPSTASH_REDIS_REST_TOKEN

# Cron
✅ CRON_SECRET

# Monitoring
✅ NEXT_PUBLIC_SENTRY_DSN

# Backups (optional)
⚪ AWS_BACKUP_BUCKET
⚪ AWS_ACCESS_KEY_ID
⚪ AWS_SECRET_ACCESS_KEY
⚪ SLACK_WEBHOOK_URL
```

### Production Deployment Checklist

- [ ] All environment variables configured
- [ ] Resend domain verified (SPF/DKIM/DMARC)
- [ ] Resend webhook configured
- [ ] Upstash Redis database created
- [ ] Sentry project created
- [ ] Backup script tested
- [ ] Cron job scheduled
- [ ] Unsubscribe page tested
- [ ] Email sending tested end-to-end
- [ ] Webhook events tracked successfully

---

**Status**: ✅ PRODUCTION READY
**Last Updated**: October 26, 2025
**Reference**: [Production Deployment Guide](/Users/eko3/limn-systems-enterprise-docs/00-MASTER-PLANS/PRODUCTION-DEPLOYMENT-GUIDE.md)
