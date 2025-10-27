/**
 * Debug endpoint to show EXACT database state
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [userCount, adminLogCount, securityLogCount] = await Promise.all([
      prisma.user_profiles.count(),
      prisma.admin_audit_log.count(),
      prisma.security_audit_log.count(),
    ]);

    const users = await prisma.user_profiles.findMany({
      select: { email: true, user_type: true, created_at: true },
      orderBy: { email: 'asc' },
    });

    const adminLogs = await prisma.admin_audit_log.findMany({
      select: { action: true, user_email: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database_host: process.env.DATABASE_URL?.match(/db\.([^:]+)/)?.[0] || 'unknown',
      counts: {
        users: userCount,
        admin_logs: adminLogCount,
        security_logs: securityLogCount,
      },
      users: users.map(u => ({
        email: u.email,
        type: u.user_type,
        created: u.created_at?.toISOString().split('T')[0] || 'N/A',
      })),
      admin_logs_sample: adminLogs.map(l => ({
        action: l.action,
        user: l.user_email,
        date: l.created_at?.toISOString() || 'N/A',
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
