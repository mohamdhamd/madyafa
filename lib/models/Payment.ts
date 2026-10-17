import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = "paid" | "partial" | "exempt" | "unpaid";

export interface IPayment extends Document {
  workspaceId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  status: PaymentStatus;
  paidAmount: number;
  note?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, ref: "Column", required: true, index: true },
    status: {
      type: String,
      enum: ["paid", "partial", "exempt", "unpaid"],
      default: "unpaid",
      required: true,
    },
    paidAmount: { type: Number, default: 0 },
    note: { type: String, trim: true, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of payment record per member per column
PaymentSchema.index({ memberId: 1, columnId: 1 }, { unique: true });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
