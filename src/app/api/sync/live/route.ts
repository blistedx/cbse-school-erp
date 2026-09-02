/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifySessionToken } from '@/lib/auth-guard';

// Force dynamic execution for real-time Server-Sent Events stream
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // SSE cannot use custom headers from EventSource API.
  // Accept token via query param: ?token=<session_token>
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing session token.' },
      { status: 401 }
    );
  }

  const encoder = new TextEncoder();
  const storePath = path.join(process.cwd(), 'data', 'erp_store.json');

  let lastMtime = 0;
  if (fs.existsSync(storePath)) {
    try {
      lastMtime = fs.statSync(storePath).mtimeMs;
    } catch (e) {}
  }

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial handshake
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now(), message: 'Real-Time Offline Node Agent Connected' })}\n\n`)
      );

      // Heartbeat interval to keep connection alive and detect changes
      const interval = setInterval(() => {
        try {
          if (fs.existsSync(storePath)) {
            const currentMtime = fs.statSync(storePath).mtimeMs;
            if (currentMtime > lastMtime) {
              lastMtime = currentMtime;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'DATA_CHANGED', timestamp: Date.now(), mtime: currentMtime })}\n\n`)
              );
              return;
            }
          }

          // Ping heartbeat
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`)
          );
        } catch (err) {
          clearInterval(interval);
        }
      }, 2000); // 2-second live check interval

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
