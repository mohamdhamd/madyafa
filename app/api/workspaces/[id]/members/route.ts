import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/Workspace";
import { Member } from "@/lib/models/Member";
import { Payment } from "@/lib/models/Payment";

interface RouteParams {
  params: { id: string };
}

// DELETE /api/workspaces/[id]/members - Delete all members and associated payments
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

    const isOwner = workspace.ownerId.toString() === authUser.userId;
    const isMod = workspace.moderators.some((m) => m.toString() === authUser.userId);
    if (!isOwner && !isMod) {
      return NextResponse.json({ error: "ليس لديك صلاحية لحذف أعضاء هذه المضيافة" }, { status: 403 });
    }

    // Delete all members in this workspace and their payments
    await Promise.all([
      Member.deleteMany({ workspaceId: id }),
      Payment.deleteMany({ workspaceId: id }),
    ]);

    return NextResponse.json({
      success: true,
      message: "تم حذف جميع أسماء الأعضاء وسجلات دفعهم بنجاح",
    });
  } catch (error: any) {
    console.error("Delete All Members Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الأعضاء: " + (error.message || "") },
      { status: 500 }
    );
  }
}
