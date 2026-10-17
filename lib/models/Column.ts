import mongoose, { Schema, Document, Model } from "mongoose";

export interface IColumn extends Document {
  workspaceId: mongoose.Types.ObjectId;
  orderIndex: number;
  title: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    orderIndex: { type: Number, required: true, default: 0 },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

export const Column: Model<IColumn> =
  mongoose.models.Column || mongoose.model<IColumn>("Column", ColumnSchema);
