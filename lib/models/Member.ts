import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMember extends Document {
  workspaceId: mongoose.Types.ObjectId;
  orderIndex: number;
  name: string;
  phone?: string;
  generalNote?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    orderIndex: { type: Number, required: true, default: 0 },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    generalNote: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
