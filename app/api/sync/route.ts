import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Member } from "@/lib/models/Member";
import { Column } from "@/lib/models/Column";
import { Payment } from "@/lib/models/Payment";
import { Expense } from "@/lib/models/Expense";
import { Workspace } from "@/lib/models/Workspace";
import mongoose from "mongoose";

interface ClientSyncOp {
  action: "create" | "update" | "delete";
  entity: "workspace" | "member" | "column" | "payment" | "expense";
  entityId: string;
  workspaceId: string;
  payload: any;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "غير مصرح للمزامنة" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const operations: ClientSyncOp[] = body.operations || [];

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0 });
    }

    let processedCount = 0;

    for (const op of operations) {
      const { action, entity, entityId, workspaceId, payload } = op;

      try {
        if (entity === "member") {
          if (action === "delete") {
            if (mongoose.Types.ObjectId.isValid(entityId)) {
              await Member.findByIdAndDelete(entityId);
              await Payment.deleteMany({ memberId: entityId });
            }
          } else {
            const isMongoId = mongoose.Types.ObjectId.isValid(entityId);
            const query = isMongoId ? { _id: entityId } : { workspaceId, name: payload.name };
            await Member.findOneAndUpdate(
              query,
              {
                workspaceId,
                name: payload.name,
                phone: payload.phone || "",
                generalNote: payload.generalNote || "",
                orderIndex: payload.orderIndex ?? 0,
                isActive: payload.isActive ?? true,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        } else if (entity === "column") {
          if (action === "delete") {
            if (mongoose.Types.ObjectId.isValid(entityId)) {
              await Column.findByIdAndDelete(entityId);
              await Payment.deleteMany({ columnId: entityId });
            }
          } else {
            const isMongoId = mongoose.Types.ObjectId.isValid(entityId);
            const query = isMongoId ? { _id: entityId } : { workspaceId, title: payload.title };
            await Column.findOneAndUpdate(
              query,
              {
                workspaceId,
                title: payload.title,
                amount: Number(payload.amount) || 100,
                orderIndex: payload.orderIndex ?? 0,
                isArchived: payload.isArchived ?? false,
                archivedAt: payload.archivedAt ? new Date(payload.archivedAt) : undefined,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        } else if (entity === "payment") {
          const { memberId, columnId, status, paidAmount, note } = payload;
          if (memberId && columnId) {
            await Payment.findOneAndUpdate(
              { memberId, columnId },
              {
                workspaceId,
                memberId,
                columnId,
                status: status || "unpaid",
                paidAmount: Number(paidAmount) || 0,
                note: note || "",
                updatedBy: authUser.name,
              },
              { upsert: true, new: true }
            );
          }
        } else if (entity === "expense") {
          if (action === "delete") {
            if (mongoose.Types.ObjectId.isValid(entityId)) {
              await Expense.findByIdAndDelete(entityId);
            }
          } else {
            const isMongoId = mongoose.Types.ObjectId.isValid(entityId);
            const query = isMongoId ? { _id: entityId } : { workspaceId, title: payload.title, amount: payload.amount };
            await Expense.findOneAndUpdate(
              query,
              {
                workspaceId,
                title: payload.title,
                amount: Number(payload.amount) || 0,
                date: payload.date ? new Date(payload.date) : new Date(),
                note: payload.note || "",
                createdBy: authUser.name,
              },
              { upsert: true, new: true }
            );
          }
        } else if (entity === "workspace") {
          if (action === "update" && mongoose.Types.ObjectId.isValid(workspaceId)) {
            await Workspace.findByIdAndUpdate(workspaceId, {
              title: payload.title,
              description: payload.description,
              settings: payload.settings,
            });
          }
        }

        processedCount++;
      } catch (opErr) {
        console.error(`Error processing sync op (${entity} ${action}):`, opErr);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Batch Sync Error:", error);
    return NextResponse.json(
      { error: "فشلت عملية المزامنة: " + (error.message || "") },
      { status: 500 }
    );
  }
}
