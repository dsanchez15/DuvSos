import { describe, it, expect, beforeEach } from 'vitest';
import { TopicService, normalizeTopicName } from '@/lib/study/topic-service';

describe('TopicService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a topic', () => {
    const topic = TopicService.create('Mathematics');
    expect(topic).not.toBeNull();
    expect(topic?.name).toBe('Mathematics');
    expect(topic?.normalizedName).toBe('mathematics');
  });

  it('prevents duplicate topics', () => {
    TopicService.create('Math');
    const dup = TopicService.create('  math  ');
    expect(dup).toBeNull();
  });

  it('lists topics alphabetically', () => {
    TopicService.create('Zebra');
    TopicService.create('Apple');
    TopicService.create('Banana');

    const all = TopicService.getAll();
    expect(all.map((t) => t.name)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('deletes a topic', () => {
    const topic = TopicService.create('ToDelete');
    expect(TopicService.getAll()).toHaveLength(1);
    TopicService.delete(topic!.id);
    expect(TopicService.getAll()).toHaveLength(0);
  });

  it('returns false when deleting non-existent topic', () => {
    const result = TopicService.delete('non-existent-id');
    expect(result).toBe(false);
  });

  it('normalizes topic names correctly', () => {
    expect(normalizeTopicName('  Hello World  ')).toBe('hello world');
    expect(normalizeTopicName('UPPERCASE')).toBe('uppercase');
    expect(normalizeTopicName('')).toBe('');
  });
});
