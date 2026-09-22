/*! EduSuite Counter QR Live Collection & SSE Dispatcher v1.0.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { FeesService } from '@/lib/services/fees.service';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface CounterQueueItem {
  id: string;
  deskId: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  amountPaise: number;
  paymentMode: string;
  receiptNo: string;
  selectedHeadsSummary: string;
  timestamp: number;
  printed: boolean;
  receiptData: any;
}

// Global In-Memory Ring Buffer & SSE Client Emitters for Live Desks
declare global {
  // eslint-disable-next-line no-var
  var __counterQueue: CounterQueueItem[] | undefined;
  // eslint-disable-next-line no-var
  var __counterSseClients: Set<(data: string) => void> | undefined;
}

const counterQueue: CounterQueueItem[] = global.__counterQueue || (global.__counterQueue = []);
const sseClients: Set<(data: string) => void> = global.__counterSseClients || (global.__counterSseClients = new Set());

function broadcastToDesks(event: { type: string; payload: any }) {
  const payloadStr = `data: ${JSON.stringify(event)}\n\n`;
  for (const send of sseClients) {
    try {
      send(payloadStr);
    } catch {
      // client disconnected
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'queue';
    const deskId = searchParams.get('desk_id') || searchParams.get('deskId') || 'COUNTER_ALL';
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId') || 'DPS2026';

    // 1. SSE Real-Time Event Stream for Cashier Desk
    if (action === 'stream') {
      const encoder = new TextEncoder();
      let clientListener: ((data: string) => void) | null = null;

      const customReadable = new ReadableStream({
        start(controller) {
          // Handshake
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', deskId, timestamp: Date.now() })}\n\n`)
          );

          clientListener = (data: string) => {
            try {
              controller.enqueue(encoder.encode(data));
            } catch {
              if (clientListener) sseClients.delete(clientListener);
            }
          };

          sseClients.add(clientListener);

          // Heartbeat keep-alive every 15 seconds
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`));
            } catch {
              clearInterval(heartbeat);
              if (clientListener) sseClients.delete(clientListener);
            }
          }, 15000);

          req.signal.addEventListener('abort', () => {
            clearInterval(heartbeat);
            if (clientListener) sseClients.delete(clientListener);
          });
        },
        cancel() {
          if (clientListener) sseClients.delete(clientListener);
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

    // 2. Queue list for active desk
    const filteredQueue = counterQueue
      .filter(q => q.schoolId === schoolId && (deskId === 'COUNTER_ALL' || q.deskId === deskId))
      .slice(-50)
      .reverse();

    return NextResponse.json({
      success: true,
      deskId,
      queue: filteredQueue,
      unprintedCount: filteredQueue.filter(q => !q.printed).length
    });
  } catch (error: any) {
    console.error('[API_FEES_COUNTER_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Counter API error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const action = body.action || 'submit_counter_payment';
    const schoolId = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (schoolId instanceof NextResponse) return schoolId;

    // 1. Mark item as Printed by Accountant
    if (action === 'mark_printed') {
      const receiptNo = body.receipt_no || body.receiptNo;
      const target = counterQueue.find(q => q.receiptNo === receiptNo);
      if (target) {
        target.printed = true;
      }
      broadcastToDesks({
        type: 'RECEIPT_PRINTED',
        payload: { receiptNo, printedBy: (auth as any).userId || 'ACCOUNTANT' }
      });
      return NextResponse.json({ success: true, message: 'Receipt marked as printed' });
    }

    // 2. Submit Counter Fee Payment from Parent Scanner / Portal
    const {
      student_id,
      desk_id = 'DESK_01',
      session = '2026-27',
      amount_paise,
      payment_mode = 'UPI',
      txn_ref,
      selected_keys = [],
      selected_summary = '',
      remarks = 'Counter QR Self-Payment'
    } = body;

    if (!student_id) {
      return NextResponse.json({ success: false, error: 'student_id is required' }, { status: 400 });
    }

    if (!amount_paise || Number(amount_paise) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Get Student details
    const students = await Database.getStudents(schoolId, session);
    const student = students.find(s => s.id === student_id || s.admission_no === student_id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student record not found in school directory' }, { status: 404 });
    }

    // Execute standard collection in Double-Entry Ledger
    const result = await FeesService.collectFee({
      schoolId,
      studentId: student.id,
      session,
      amountPaise: Number(amount_paise),
      paymentMode: payment_mode,
      txnRef: txn_ref || `CTR-${Date.now().toString(36).toUpperCase()}`,
      remarks: `${remarks} [${desk_id}]`,
      collectedBy: `PARENT_QR_SCAN (${student.admission_no})`,
      selectedHeadPeriodKeys: selected_keys,
      autoAllocate: true
    });

    if (!result.success || !result.receipt) {
      return NextResponse.json({ success: false, error: result.error || 'Payment posting failed' }, { status: 400 });
    }

    // Create Counter Queue Item
    const queueItem: CounterQueueItem = {
      id: `CTR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deskId: desk_id,
      schoolId,
      studentId: student.id,
      studentName: student.full_name,
      admissionNo: student.admission_no,
      className: student.class_name,
      section: student.section,
      amountPaise: Number(amount_paise),
      paymentMode: payment_mode,
      receiptNo: result.receipt.receipt_no,
      selectedHeadsSummary: selected_summary || `${selected_keys.length} Items Selected`,
      timestamp: Date.now(),
      printed: false,
      receiptData: result.receipt
    };

    // Store in ring buffer (max 200 items)
    counterQueue.push(queueItem);
    if (counterQueue.length > 200) {
      counterQueue.shift();
    }

    // Broadcast instant real-time event to connected Accountant desks
    broadcastToDesks({
      type: 'NEW_COUNTER_PAYMENT',
      payload: queueItem
    });

    return NextResponse.json({
      success: true,
      message: 'Payment received successfully. Please collect your receipt at the counter.',
      queueItem,
      receipt: result.receipt
    });
  } catch (error: any) {
    console.error('[API_FEES_COUNTER_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Counter submission error' }, { status: 500 });
  }
}
