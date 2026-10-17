import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/Workspace";
import { Member } from "@/lib/models/Member";
import { Column } from "@/lib/models/Column";
import { Payment } from "@/lib/models/Payment";
import { Expense } from "@/lib/models/Expense";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return NextResponse.json({ error: "المضيافة غير موجودة" }, { status: 404 });
    }

    // Check permissions
    const isOwner = workspace.ownerId.toString() === authUser.userId;
    const isMod = workspace.moderators.some((m) => m.toString() === authUser.userId);
    if (!isOwner && !isMod) {
      return NextResponse.json({ error: "ليس لديك صلاحية للوصول لهذه المضيافة" }, { status: 403 });
    }

    const [members, columns, payments, expenses] = await Promise.all([
      Member.find({ workspaceId: id, isActive: true }).sort({ orderIndex: 1 }),
      Column.find({ workspaceId: id }).sort({ orderIndex: 1 }),
      Payment.find({ workspaceId: id }),
      Expense.find({ workspaceId: id }).sort({ date: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        title: workspace.title,
        description: workspace.description || "",
        ownerId: workspace.ownerId.toString(),
        isOwner,
        settings: workspace.settings,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      members: members.map((m) => ({
        id: m._id.toString(),
        workspaceId: m.workspaceId.toString(),
        orderIndex: m.orderIndex,
        name: m.name,
        phone: m.phone || "",
        generalNote: m.generalNote || "",
        isActive: m.isActive,
      })),
      columns: columns.map((c) => ({
        id: c._id.toString(),
        workspaceId: c.workspaceId.toString(),
        orderIndex: c.orderIndex,
        title: c.title,
        amount: c.amount,
        isArchived: c.isArchived ?? false,
        archivedAt: c.archivedAt ? c.archivedAt.toISOString() : undefined,
      })),
      payments: payments.map((p) => ({
        id: p._id.toString(),
        workspaceId: p.workspaceId.toString(),
        memberId: p.memberId.toString(),
        columnId: p.columnId.toString(),
        status: p.status,
        paidAmount: p.paidAmount,
        note: p.note || "",
        updatedBy: p.updatedBy || "",
        updatedAt: p.updatedAt,
      })),
      expenses: expenses.map((e) => ({
        id: e._id.toString(),
        workspaceId: e.workspaceId.toString(),
        title: e.title,
        amount: e.amount,
        date: e.date,
        note: e.note || "",
        createdBy: e.createdBy || "",
      })),
    });
  } catch (error: any) {
    console.error("Get Workspace Details Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحميل بيانات المضيافة: " + (error.message || "") },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return NextResponse.json({ error: "المضيافة غير موجودة" }, { status: 404 });
    }

    if (workspace.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: "فقط صاحب المضيافة يمكنه تعديل الإعدادات" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, settings } = body;

    if (title?.trim()) workspace.title = title.trim();
    if (description !== undefined) workspace.description = description.trim();
    if (settings) {
      if (settings.defaultAmount !== undefined) workspace.settings.defaultAmount = Number(settings.defaultAmount);
      if (settings.defaultColPrefix) workspace.settings.defaultColPrefix = settings.defaultColPrefix.trim();
      if (settings.currency) workspace.settings.currency = settings.currency.trim();
      if (settings.publicSlug) workspace.settings.publicSlug = settings.publicSlug.trim().toLowerCase();
      if (settings.publicPin !== undefined) workspace.settings.publicPin = settings.publicPin.trim();
      if (settings.autoColumnMode) workspace.settings.autoColumnMode = settings.autoColumnMode;
      if (settings.preventDuplicateMembers !== undefined) {
        workspace.settings.preventDuplicateMembers = Boolean(settings.preventDuplicateMembers);
      }
    }

    await workspace.save();

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error("Update Workspace Error:", error);
    return NextResponse.json(
      { error: "فشل حفظ الإعدادات: " + (error.message || "") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return NextResponse.json({ error: "المضيافة غير موجودة" }, { status: 404 });
    }

    if (workspace.ownerId.toString() !== authUser.userId) {
      return NextResponse.json({ error: "فقط مالك الجمعية يمكنه حذفها" }, { status: 403 });
    }

    // Cascade delete
    await Promise.all([
      Workspace.findByIdAndDelete(id),
      Member.deleteMany({ workspaceId: id }),
      Column.deleteMany({ workspaceId: id }),
      Payment.deleteMany({ workspaceId: id }),
      Expense.deleteMany({ workspaceId: id }),
    ]);

    return NextResponse.json({ success: true, message: "تم حذف المضيافة وجميع بياناتها بنجاح" });
  } catch (error: any) {
    console.error("Delete Workspace Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المضيافة: " + (error.message || "") },
      { status: 500 }
    );
  }
}
