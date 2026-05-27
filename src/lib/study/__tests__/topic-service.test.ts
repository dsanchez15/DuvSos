import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TopicService } from '@/lib/study/topic-service';

describe('TopicService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists topics from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', name: 'Apple', normalizedName: 'apple', createdAt: '2024-01-01' },
        { id: '2', name: 'Banana', normalizedName: 'banana', createdAt: '2024-01-01' },
        { id: '3', name: 'Zebra', normalizedName: 'zebra', createdAt: '2024-01-01' },
      ],
    });

    const all = await TopicService.getAll();
    expect(all.map((t) => t.name)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('normalizes topic names correctly', () => {
    const normalize = (s: string) => s.toLowerCase().trim();
    expect(normalize('  Hello World  ')).toBe('hello world');
    expect(normalize('UPPERCASE')).toBe('uppercase');
    expect(normalize('')).toBe('');
  });
});
