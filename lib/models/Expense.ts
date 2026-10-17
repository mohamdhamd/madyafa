import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  workspaceId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  date: Date;
  note?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
