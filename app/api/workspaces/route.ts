import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/Workspace";
import { Member } from "@/lib/models/Member";
import { Column } from "@/lib/models/Column";
import { Payment } from "@/lib/models/Payment";
import { Expense } from "@/lib/models/Expense";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول أولاً" }, { status: 401 });
    }

    await connectToDatabase();
    const workspaces = await Workspace.find({
      $or: [{ ownerId: authUser.userId }, { moderators: authUser.userId }],
    }).sort({ updatedAt: -1 });

    // Gather quick stats for dashboard cards
    const results = await Promise.all(
      workspaces.map(async (ws) => {
        const memberCount = await Member.countDocuments({ workspaceId: ws._id, isActive: true });
        const expensesSum = await Expense.aggregate([
          { $match: { workspaceId: ws._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalExpenses = expensesSum[0]?.total || 0;

        return {
          id: ws._id.toString(),
          title: ws.title,
          description: ws.description || "",
          ownerId: ws.ownerId.toString(),
          isOwner: ws.ownerId.toString() === authUser.userId,
          settings: ws.settings,
          memberCount,
          totalExpenses,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, workspaces: results });
  } catch (error: any) {
    console.error("Fetch Workspaces Error:", error);
    return NextResponse.json(
      { error: "فشل جلب قائمة الجمعيات: " + (error.message || "") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { title, description, defaultAmount, defaultColPrefix } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "يرجى تحديد اسم المضيافة أو الجمعية" }, { status: 400 });
    }

    const slug = `${title.trim().replace(/\s+/g, "-").toLowerCase().slice(0, 30)}-${Date.now().toString(36)}`;

    const workspace = await Workspace.create({
      title: title.trim(),
      description: description?.trim() || "",
      ownerId: authUser.userId,
      moderators: [],
      settings: {
        defaultAmount: Number(defaultAmount) || 100,
        defaultColPrefix: defaultColPrefix?.trim() || "دفعة",
        currency: "ج.م",
        publicSlug: slug,
        publicPin: "",
      },
    });

    // Create 2 initial columns
    await Column.create([
      {
        workspaceId: workspace._id,
        orderIndex: 0,
        title: `${workspace.settings.defaultColPrefix} 1`,
        amount: workspace.settings.defaultAmount,
      },
      {
        workspaceId: workspace._id,
        orderIndex: 1,
        title: `${workspace.settings.defaultColPrefix} 2`,
        amount: workspace.settings.defaultAmount,
      },
    ]);

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        title: workspace.title,
        description: workspace.description,
        settings: workspace.settings,
      },
    });
  } catch (error: any) {
    console.error("Create Workspace Error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء المضيافة: " + (error.message || "") },
      { status: 500 }
    );
  }
}
