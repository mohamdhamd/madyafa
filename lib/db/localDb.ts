import Dexie, { Table } from "dexie";

export interface LocalWorkspace {
  id: string; // MongoDB _id or client generated temporary id
  title: string;
  description?: string;
  ownerId?: string;
  settings: {
    defaultAmount: number;
    defaultColPrefix: string;
    currency: string;
    publicSlug: string;
    publicPin?: string;
    autoColumnMode?: "on_complete" | "on_first_check" | "manual";
    preventDuplicateMembers?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalMember {
  id: string;
  workspaceId: string;
  orderIndex: number;
  name: string;
  phone?: string;
  generalNote?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalColumn {
  id: string;
  workspaceId: string;
  orderIndex: number;
  title: string;
  amount: number;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalPayment {
  id: string; // `${memberId}_${columnId}` or MongoDB _id
  workspaceId: string;
  memberId: string;
  columnId: string;
  status: "paid" | "partial" | "exempt" | "unpaid";
  paidAmount: number;
  note?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LocalExpense {
  id: string;
  workspaceId: string;
  title: string;
  amount: number;
  date: string;
  note?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface SyncQueueItem {
  id?: number;
  action: "create" | "update" | "delete";
  entity: "workspace" | "member" | "column" | "payment" | "expense";
  entityId: string;
  workspaceId: string;
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
}

export class MadyafaDexieDB extends Dexie {
  workspaces!: Table<LocalWorkspace, string>;
  members!: Table<LocalMember, string>;
  columns!: Table<LocalColumn, string>;
  payments!: Table<LocalPayment, string>;
  expenses!: Table<LocalExpense, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("MadyafaOfflineDB_v2");
    this.version(1).stores({
      workspaces: "id, settings.publicSlug",
      members: "id, workspaceId, orderIndex, name",
      columns: "id, workspaceId, orderIndex",
      payments: "id, workspaceId, memberId, columnId, [memberId+columnId]",
      expenses: "id, workspaceId, date",
      syncQueue: "++id, entity, entityId, workspaceId, status, timestamp",
    });
  }
}

export const localDb = new MadyafaDexieDB();
