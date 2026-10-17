import { localDb, SyncQueueItem, LocalWorkspace, LocalMember, LocalColumn, LocalPayment, LocalExpense } from "@/lib/db/localDb";

export type SyncState = "synced" | "offline" | "syncing" | "pending";

type SyncListener = (state: SyncState, pendingCount: number) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private currentState: SyncState = "synced";
  private isSyncing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
      this.currentState = navigator.onLine ? "synced" : "offline";
    }
  }

  public init() {
    if (typeof window === "undefined") return;

    if (!this.intervalId) {
      // Sync every 15 seconds if online and has pending queue
      this.intervalId = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncPending();
        }
      }, 15000);
    }

    this.updateStatus();
    if (navigator.onLine) {
      this.syncPending();
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    this.getPendingCount().then((count) => {
      listener(this.currentState, count);
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    const count = await this.getPendingCount();
    this.listeners.forEach((listener) => listener(this.currentState, count));
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.currentState = "offline";
      this.notifyListeners();
    } else {
      this.currentState = "synced";
      this.syncPending();
    }
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await localDb.syncQueue.count();
    } catch {
      return 0;
    }
  }

  private async updateStatus() {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      this.currentState = "offline";
    } else {
      const count = await this.getPendingCount();
      this.currentState = count > 0 ? "pending" : "synced";
    }
    this.notifyListeners();
  }

  // --- Optimistic Local Writes with Queueing ---

  public async queueOperation(
    action: "create" | "update" | "delete",
    entity: "workspace" | "member" | "column" | "payment" | "expense",
    entityId: string,
    workspaceId: string,
    payload: any
  ) {
    const queueItem: SyncQueueItem = {
      action,
      entity,
      entityId,
      workspaceId,
      payload,
      timestamp: Date.now(),
      status: "pending",
    };

    await localDb.syncQueue.add(queueItem);
    await this.updateStatus();

    // Trigger sync immediately if online
    if (navigator.onLine && !this.isSyncing) {
      this.syncPending();
    }
  }

  public async optimisticUpsertMember(member: LocalMember) {
    await localDb.members.put(member);
    await this.queueOperation("update", "member", member.id, member.workspaceId, member);
  }

  public async optimisticDeleteMember(id: string, workspaceId: string) {
    await localDb.members.delete(id);
    await this.queueOperation("delete", "member", id, workspaceId, { id });
  }

  public async optimisticUpsertColumn(column: LocalColumn) {
    await localDb.columns.put(column);
    await this.queueOperation("update", "column", column.id, column.workspaceId, column);
  }

  public async optimisticDeleteColumn(id: string, workspaceId: string) {
    await localDb.columns.delete(id);
    await this.queueOperation("delete", "column", id, workspaceId, { id });
  }

  public async optimisticUpsertPayment(payment: LocalPayment) {
    await localDb.payments.put(payment);
    await this.queueOperation("update", "payment", payment.id, payment.workspaceId, payment);
  }

  public async optimisticUpsertExpense(expense: LocalExpense) {
    await localDb.expenses.put(expense);
    await this.queueOperation("update", "expense", expense.id, expense.workspaceId, expense);
  }

  public async optimisticDeleteExpense(id: string, workspaceId: string) {
    await localDb.expenses.delete(id);
    await this.queueOperation("delete", "expense", id, workspaceId, { id });
  }

  // --- Background Sync Push & Pull ---

  public async syncPending() {
    if (this.isSyncing || typeof window === "undefined" || !navigator.onLine) return;

    try {
      this.isSyncing = true;
      this.currentState = "syncing";
      this.notifyListeners();

      const items = await localDb.syncQueue.orderBy("timestamp").toArray();
      if (items.length === 0) {
        this.currentState = "synced";
        this.notifyListeners();
        this.isSyncing = false;
        return;
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: items }),
      });

      if (res.ok) {
        const result = await res.json();
        // Remove successfully processed sync items
        const processedIds = items.map((i) => i.id!).filter(Boolean);
        await localDb.syncQueue.bulkDelete(processedIds);

        // If server returned ID mappings or updated records, update local Dexie
        if (result.serverUpdates) {
          await this.applyServerUpdates(result.serverUpdates);
        }

        this.currentState = "synced";
      } else {
        this.currentState = "pending";
      }
    } catch {
      this.currentState = "offline";
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public async applyServerUpdates(updates: {
    workspaces?: LocalWorkspace[];
    members?: LocalMember[];
    columns?: LocalColumn[];
    payments?: LocalPayment[];
    expenses?: LocalExpense[];
  }) {
    if (updates.workspaces?.length) await localDb.workspaces.bulkPut(updates.workspaces);
    if (updates.members?.length) await localDb.members.bulkPut(updates.members);
    if (updates.columns?.length) await localDb.columns.bulkPut(updates.columns);
    if (updates.payments?.length) await localDb.payments.bulkPut(updates.payments);
    if (updates.expenses?.length) await localDb.expenses.bulkPut(updates.expenses);
  }
}

export const syncEngine = new SyncEngine();
