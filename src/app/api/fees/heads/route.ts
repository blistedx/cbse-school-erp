import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import FeeHead from '@/models/fees/FeeHead';
import { getSessionUser } from '@/lib/auth';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';
import { validateRequest, FeeHeadSchema } from '@/lib/fees/validations';

// Default CBSE 2026-27 Fee Heads Seed
function getDefaultCBSEFeeHeads(schoolId: string) {
  return [
    {
      schoolId,
      name: 'Prospectus + Registration Fees',
      code: 'REG',
      type: 'one-time' as const,
      frequency: 'yearly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'Admission Fee (Non-Refundable)',
      code: 'ADM',
      type: 'one-time' as const,
      frequency: 'yearly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'Tuition Fee (Quarterly Deposit)',
      code: 'TUI',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'Annual Fee',
      code: 'ANN',
      type: 'recurring' as const,
      frequency: 'yearly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'Hostel Security Money (Refundable)',
      code: 'HST-SEC',
      type: 'one-time' as const,
      frequency: 'yearly' as const,
      isRefundable: true,
      isActive: true
    },
    {
      schoolId,
      name: 'Transfer Certificate / Character Certificate',
      code: 'TC-CC',
      type: 'one-time' as const,
      frequency: 'yearly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'School Transport Fee (1 to 3 km)',
      code: 'TRN-1-3',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'School Transport Fee (4 to 6 km)',
      code: 'TRN-4-6',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'School Transport Fee (7 to 12 km)',
      code: 'TRN-7-12',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'School Transport Fee (13 to 16 km)',
      code: 'TRN-13-16',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    },
    {
      schoolId,
      name: 'School Transport Fee (16 to 20 km)',
      code: 'TRN-16-20',
      type: 'recurring' as const,
      frequency: 'monthly' as const,
      isRefundable: false,
      isActive: true
    }
  ];
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenantResult = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenantResult instanceof NextResponse) return tenantResult;
    const schoolId = tenantResult;

    await connectDB();

    let heads: any[] = [];
    try {
      heads = await FeeHead.find({ 
        schoolId, 
        isActive: true 
      }).sort({ createdAt: -1 }).lean();
    } catch {
      const db = await getDatabase();
      if (db) {
        const rawDocs = await db.collection('fee_heads').find({ schoolId, isActive: true }).toArray();
        heads = rawDocs.map(sanitizeDocNoBinary);
      }
    }

    // Auto-seed default CBSE fee heads if newly registered school has none
    if (!heads || heads.length === 0) {
      const defaultHeads = getDefaultCBSEFeeHeads(schoolId);
      try {
        heads = await FeeHead.insertMany(defaultHeads as any);
      } catch {
        const db = await getDatabase();
        if (db) {
          await db.collection('fee_heads').insertMany(defaultHeads);
          heads = defaultHeads;
        }
      }
    }

    return NextResponse.json({ success: true, count: heads.length, data: heads });
  } catch (error: any) {
    console.error('[API FeeHeads GET Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch fee heads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const sessionUser = getSessionUser(req);
    const body = await req.json();
    const schoolId = body.schoolId || sessionUser?.schoolId || auth.schoolId;

    const validation = validateRequest(FeeHeadSchema, { ...body, schoolId });
    if (!validation.success) {
      return validation.response;
    }
    const validatedData = validation.data;

    await connectDB();

    const headPayload = {
      schoolId,
      name: validatedData.name.trim(),
      code: validatedData.code.trim().toUpperCase(),
      type: validatedData.type || 'recurring',
      frequency: validatedData.frequency || 'monthly',
      isRefundable: Boolean(validatedData.isRefundable),
      isActive: validatedData.isActive !== undefined ? Boolean(validatedData.isActive) : true,
    };

    let createdHead: any;
    try {
      createdHead = await FeeHead.create(headPayload as any);
    } catch (err: any) {
      const db = await getDatabase();
      if (db) {
        const res = await db.collection('fee_heads').insertOne({
          ...headPayload,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        createdHead = { _id: res.insertedId, ...headPayload };
      } else {
        throw err;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Fee head created successfully',
      data: createdHead 
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API FeeHeads POST Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create fee head' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    if (!body.id && !body._id) {
      return NextResponse.json({ success: false, error: 'Fee head ID is required' }, { status: 400 });
    }

    await connectDB();
    const headId = body.id || body._id;

    let updated: any;
    try {
      updated = await (FeeHead as any).findByIdAndUpdate(
        headId,
        {
          $set: {
            name: body.name,
            code: body.code,
            type: body.type,
            frequency: body.frequency,
            isRefundable: body.isRefundable,
            isActive: body.isActive,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
    } catch {
      const db = await getDatabase();
      if (db) {
        await db.collection('fee_heads').updateOne(
          { _id: headId as any },
          { $set: { ...body, updatedAt: new Date() } }
        );
        updated = body;
      }
    }

    return NextResponse.json({ success: true, message: 'Fee head updated', data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const headId = searchParams.get('id');

    if (!headId) {
      return NextResponse.json({ success: false, error: 'Fee head ID is required' }, { status: 400 });
    }

    await connectDB();
    try {
      await (FeeHead as any).findByIdAndUpdate(headId, { isActive: false });
    } catch {
      const db = await getDatabase();
      if (db) {
        await db.collection('fee_heads').updateOne({ _id: headId as any }, { $set: { isActive: false } });
      }
    }

    return NextResponse.json({ success: true, message: 'Fee head deactivated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
