import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkspaceSettings {
  defaultAmount: number;
  defaultColPrefix: string;
  currency: string;
  publicSlug: string;
  publicPin?: string;
  autoColumnMode?: "on_complete" | "on_first_check" | "manual";
}

export interface IWorkspace extends Document {
  title: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  settings: IWorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    moderators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    settings: {
      defaultAmount: { type: Number, default: 100 },
      defaultColPrefix: { type: String, default: "دفعة" },
      currency: { type: String, default: "ج.م" },
      publicSlug: { type: String, required: true, unique: true, index: true },
      publicPin: { type: String, default: "" },
      autoColumnMode: {
        type: String,
        enum: ["on_complete", "on_first_check", "manual"],
        default: "on_complete",
      },
    },
  },
  { timestamps: true }
);

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace || mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
