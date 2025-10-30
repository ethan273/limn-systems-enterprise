/**
 * Server-Sent Events (SSE) Endpoint - Phase 3 Session 3
 *
 * Real-time event streaming via SSE for client subscriptions
 *
 * @module api/events
 * @created 2025-10-30
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';

/**
 * SSE endpoint for streaming real-time events to clients
 *
 * Usage: const eventSource = new EventSource('/api/events');
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Set up SSE headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in nginx
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection success message
      const connectionMessage = `data: ${JSON.stringify({
        type: 'connected',
        userId: user.id,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionMessage));

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat ${Date.now()}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('[SSE] Heartbeat error:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // TODO: Set up event listener for real-time events
      // When events are published via publishEvent, they should be broadcast here
      // Implementation options:
      // 1. Use Redis pub/sub for multi-instance support
      // 2. Use in-memory EventEmitter for single-instance
      // 3. Poll database for new events (simple but less efficient)

      // Example event polling (simple implementation)
      const pollInterval = setInterval(async () => {
        try {
          // TODO: Query recent undelivered events for user
          // const events = await db.real_time_events.findMany({
          //   where: {
          //     recipient_user_ids: { has: user.id },
          //     delivered_to: { not: { has: user.id } },
          //   },
          //   take: 10,
          //   orderBy: { created_at: 'desc' },
          // });

          // // Send each event to the client
          // for (const event of events) {
          //   const message = `data: ${JSON.stringify(event)}\n\n`;
          //   controller.enqueue(encoder.encode(message));
          // }
        } catch (error) {
          console.error('[SSE] Polling error:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log('[SSE] Client disconnected:', user.id);
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}

/**
 * Health check endpoint
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}
