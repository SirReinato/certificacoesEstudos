export const syncService = {
  async checkUpdates() {
    const res = await fetch('/api/sync/check');
    return res.json();
  },
  async markSynced() {
    await fetch('/api/sync/mark-synced', { method: 'POST' });
  },
  async updateExamVersion(examId: string, version: string) {
    await fetch('/api/sync/update-version', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ examId, version }) });
  },
};