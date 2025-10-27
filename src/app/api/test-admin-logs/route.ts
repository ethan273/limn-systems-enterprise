/**
 * Test endpoint to check admin logs directly
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const adminLogsCount = await prisma.admin_audit_log.count();
    const securityLogsCount = await prisma.security_audit_log.count();
    const loginLogsCount = await prisma.sso_login_audit.count();

    const adminLogs = await prisma.admin_audit_log.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      counts: {
        admin: adminLogsCount,
        security: securityLogsCount,
        login: loginLogsCount,
      },
      sample_admin_logs: adminLogs.map(log => ({
        date: log.created_at,
        action: log.action,
        user: log.user_email,
      })),
      message: adminLogsCount === 0
        ? '✅ Admin logs table is clean!'
        : `⚠️ Found ${adminLogsCount} admin logs`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
