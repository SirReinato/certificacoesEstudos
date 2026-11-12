/**
 * Storage Layer — Backend SQLite via API
 * Persistência compartilhada entre navegadores/máquinas.
 */

import type {
  Content,
  Flashcard,
  StudySession,
  UserSettings,
  Exam,
} from '../types';

const API_BASE = '/api';

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      try { message = (await res.text()) || message; } catch { /* noop */ }
    }
    throw new Error(`API ${res.status}: ${message}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export async function initDB(): Promise<void> {
  await apiFetch('/health');
}

export async function initDefaultSettings(): Promise<void> { /* handled by backend seed */ }
export async function initDefaultExams(): Promise<void> { /* handled by backend seed */ }

export const contentService = {
  async getAll(): Promise<Content[]> { return await apiFetch('/contents'); },
  async getById(id: string): Promise<Content | undefined> {
    try { return await apiFetch(`/contents/${id}`); } catch { return undefined; }
  },
  async create(content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const created = await apiFetch('/contents', { method: 'POST', body: JSON.stringify(content) });
    return created.id;
  },
  async uploadSourceFile(id: string, file: File): Promise<void> {
    const response = await fetch(`${API_BASE}/contents/${encodeURIComponent(id)}/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch {
        // mantém a mensagem HTTP
      }
      throw new Error(`API ${response.status}: ${message}`);
    }
  },
  async update(id: string, changes: Partial<Content>): Promise<void> {
    await apiFetch(`/contents/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  },
  async delete(id: string): Promise<void> {
    await apiFetch(`/contents/${id}`, { method: 'DELETE' });
  },
  async search(query: string): Promise<Content[]> {
    return await apiFetch(`/contents?q=${encodeURIComponent(query)}`);
  },
  async getByType(type: Content['type']): Promise<Content[]> {
    const all = await this.getAll();
    return all.filter((c) => c.type === type);
  },
  async getStats(): Promise<{ total: number; byType: Record<string, number>; totalFlashcards: number }> {
    return await apiFetch('/contents/stats');
  },
};

export const flashcardService = {
  async getAll(): Promise<Flashcard[]> { return await apiFetch('/flashcards'); },
  async getByContentId(contentId: string): Promise<Flashcard[]> {
    return await apiFetch(`/flashcards?contentId=${encodeURIComponent(contentId)}`);
  },
  async getDue(limit?: number): Promise<Flashcard[]> {
    const qs = limit ? `?limit=${limit}` : '';
    return await apiFetch(`/flashcards/due${qs}`);
  },
  async getNewCards(contentId?: string, limit?: number): Promise<Flashcard[]> {
    const params = new URLSearchParams();
    if (contentId) params.set('contentId', contentId);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/flashcards/new${qs}`);
  },
  async createMany(flashcards: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    return await apiFetch('/flashcards/bulk', { method: 'POST', body: JSON.stringify({ flashcards }) });
  },
  async update(id: string, changes: Partial<Flashcard>): Promise<void> {
    await apiFetch(`/flashcards/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  },
  async bulkUpdate(updates: { id: string; changes: Partial<Flashcard> }[]): Promise<void> {
    await apiFetch('/flashcards/bulk-update', { method: 'POST', body: JSON.stringify({ updates }) });
  },
  async getStats(contentId?: string): Promise<{ total: number; due: number; newCards: number; learning: number; review: number }> {
    const qs = contentId ? `?contentId=${encodeURIComponent(contentId)}` : '';
    return await apiFetch(`/flashcards/stats${qs}`);
  },
};

export const sessionService = {
  async create(session: Omit<StudySession, 'id'>): Promise<string> {
    return await apiFetch('/sessions', { method: 'POST', body: JSON.stringify(session) });
  },
  async update(id: string, changes: Partial<StudySession>): Promise<void> {
    await apiFetch(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  },
  async getByDate(date: string): Promise<StudySession[]> {
    return await apiFetch(`/sessions/by-date?date=${encodeURIComponent(date)}`);
  },
  async getRecent(limit: number): Promise<StudySession[]> {
    return await apiFetch(`/sessions/recent?limit=${limit}`);
  },
  async getStreak(): Promise<number> {
    return await apiFetch('/sessions/streak');
  },
  async getTotalStats(): Promise<{ totalSessions: number; totalCards: number; totalTime: number; avgAccuracy: number }> {
    return await apiFetch('/sessions/total-stats');
  },
};

export const settingsService = {
  async get(): Promise<UserSettings | undefined> {
    try { return await apiFetch('/settings'); } catch { return undefined; }
  },
  async update(changes: Partial<UserSettings>): Promise<void> {
    await apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(changes) });
  },
  async reset(): Promise<void> {
    await apiFetch('/settings/reset', { method: 'POST' });
  },
};

export const examService = {
  async get(code: 'AI-200' | 'AI-103'): Promise<Exam | undefined> {
    try { return await apiFetch(`/exams/${code}`); } catch { return undefined; }
  },
  async getAll(): Promise<Exam[]> { return await apiFetch('/exams'); },
  async updateLastChecked(code: 'AI-200' | 'AI-103'): Promise<void> {
    await apiFetch('/exams/last-checked', { method: 'PATCH', body: JSON.stringify({ code }) });
  },
};

export async function exportAllData(): Promise<string> {
  const data = await apiFetch('/export');
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await apiFetch('/import', { method: 'POST', body: JSON.stringify(data) });
}

// compat: old code references `db` in a couple of places; provide minimal shim
export const db = {
  studySessions: {
    async update(id: string, changes: Partial<StudySession>) {
      await sessionService.update(id, changes);
    },
  },
  flashcards: {},
  contents: {},
  settings: {},
  exams: {},
};

export { /* no-op keep sync module */ };