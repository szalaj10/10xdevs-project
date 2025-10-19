import { describe, it, expect } from 'vitest';
import { formatDate, formatDuration, formatRelativeDate } from '@/lib/formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date correctly in Polish', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('stycznia');
      expect(result).toContain('2024');
    });

    it('should handle date string input', () => {
      const result = formatDate('2024-06-20T12:00:00Z');
      
      expect(result).toContain('czerwca');
      expect(result).toContain('2024');
    });

    it('should include day name', () => {
      const date = new Date('2024-01-15T10:30:00Z'); // Monday
      const result = formatDate(date);
      
      expect(result).toMatch(/Poniedziałek|Wtorek|Środa|Czwartek|Piątek|Sobota|Niedziela/);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds to minutes:seconds', () => {
      // 45000ms = 0:45
      expect(formatDuration(45000)).toBe('0:45');
    });

    it('should format minutes and seconds correctly', () => {
      // 125000ms = 2:05
      expect(formatDuration(125000)).toBe('2:05');
    });

    it('should pad seconds with zero', () => {
      // 65000ms = 1:05
      expect(formatDuration(65000)).toBe('1:05');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should handle large durations', () => {
      // 3725000ms = 62:05
      expect(formatDuration(3725000)).toBe('62:05');
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Dziś" for today', () => {
      const today = new Date();
      const result = formatRelativeDate(today);
      
      expect(result).toBe('Dziś');
    });

    it('should return "Jutro" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatRelativeDate(tomorrow);
      
      expect(result).toBe('Jutro');
    });

    it('should return "Wczoraj" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatRelativeDate(yesterday);
      
      expect(result).toBe('Wczoraj');
    });

    it('should handle date string input', () => {
      const today = new Date();
      const todayString = today.toISOString();
      const result = formatRelativeDate(todayString);
      
      // Should return either "Dziś" or "Wczoraj" depending on timezone
      expect(['Dziś', 'Wczoraj', 'Jutro']).toContain(result);
    });
  });
});


