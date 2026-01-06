import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

describe('cn (className merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('formatCurrency', () => {
  it('should format CNY currency', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
    expect(result).toContain('¥');
  });

  it('should format USD currency', () => {
    const result = formatCurrency(100, 'USD', 'en-US');
    expect(result).toContain('100');
    expect(result).toContain('$');
  });

  it('should handle decimal amounts', () => {
    const result = formatCurrency(99.99);
    expect(result).toContain('99.99');
  });
});

describe('formatDate', () => {
  it('should format date in Chinese locale', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('1');
    expect(result).toContain('15');
  });

  it('should accept string date', () => {
    const result = formatDate('2024-06-20');
    expect(result).toContain('2024');
    expect(result).toContain('6');
    expect(result).toContain('20');
  });
});

describe('formatRelativeTime', () => {
  it('should return "刚刚" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('刚刚');
  });

  it('should return minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 分钟前');
  });

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 小时前');
  });

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 天前');
  });
});
