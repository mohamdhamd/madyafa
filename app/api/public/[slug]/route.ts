import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/Workspace";
import { Member } from "@/lib/models/Member";
import { Column } from "@/lib/models/Column";
import { Payment } from "@/lib/models/Payment";
import { Expense } from "@/lib/models/Expense";

interface RouteParams {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;
    await connectToDatabase();

    const workspace = await Workspace.findOne({ "settings.publicSlug": slug });
    if (!workspace) {
      return NextResponse.json({ error: "صفحة المضيافة غير موجودة أو الرابط غير صحيح" }, { status: 404 });
    }

    // Check PIN if configured
    const pin = req.headers.get("x-public-pin") || req.nextUrl.searchParams.get("pin");
    if (workspace.settings.publicPin && workspace.settings.publicPin.trim() !== "") {
      if (!pin || pin.trim() !== workspace.settings.publicPin.trim()) {
        return NextResponse.json(
          {
            requiresPin: true,
            title: workspace.title,
            error: "هذه الصفحة محمية برمز مرور (PIN)، يرجى إدخال الرمز للمتابعة",
          },
          { status: 403 }
        );
      }
    }

    const [members, columns, payments, expenses] = await Promise.all([
      Member.find({ workspaceId: workspace._id, isActive: true }).sort({ orderIndex: 1 }),
      Column.find({ workspaceId: workspace._id }).sort({ orderIndex: 1 }),
      Payment.find({ workspaceId: workspace._id }),
      Expense.find({ workspaceId: workspace._id }).sort({ date: -1 }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        title: workspace.title,
        description: workspace.description || "",
        currency: workspace.settings.currency || "ج.م",
        defaultAmount: workspace.settings.defaultAmount,
      },
      members: members.map((m) => ({
        id: m._id.toString(),
        orderIndex: m.orderIndex,
        name: m.name,
        generalNote: m.generalNote || "",
      })),
      columns: columns.map((c) => ({
        id: c._id.toString(),
        orderIndex: c.orderIndex,
        title: c.title,
        amount: c.amount,
        isArchived: c.isArchived ?? false,
      })),
      payments: payments.map((p) => ({
        id: p._id.toString(),
        memberId: p.memberId.toString(),
        columnId: p.columnId.toString(),
        status: p.status,
        paidAmount: p.paidAmount,
        note: p.note || "",
      })),
      totalExpenses,
    });
  } catch (error: any) {
    console.error("Public View API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحميل بيانات المضيافة: " + (error.message || "") },
      { status: 500 }
    );
  }
}
