/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, ADMIN_ROLES } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const invoices = await Database.getFeeInvoices(schoolId, session);
    return NextResponse.json({ success: true, count: invoices.length, invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const schoolId = body.school_id || body.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'school_id is required.' }, { status: 400 });
    }
    const invoice = await Database.createFeeInvoice(body);
    return NextResponse.json({ success: true, message: 'Fee invoice created!', invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { invoice_id, status, payment_mode } = body;
    if (!invoice_id || !status) {
      return NextResponse.json({ success: false, error: 'invoice_id and status are required' }, { status: 400 });
    }
    const updated = await Database.updateFeeInvoiceStatus(invoice_id, status, payment_mode);
    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    const deleted = await Database.deleteFeeInvoice(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
