import { describe, expect, test } from 'vitest';
import { escapeHtml } from './html';

describe('html', () => {
  describe('escapeHtml', () => {
    test('replace &, <, >, ", and \' with their corresponding HTML entities', () => {
      expect(escapeHtml('<p>Hello & "world"\'s test!</p>')).toBe('&lt;p&gt;Hello &amp; &quot;world&quot;&#039;s test!&lt;/p&gt;');
      expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;');
      expect(escapeHtml('&lt;div&gt;')).toBe('&amp;lt;div&amp;gt;');

      expect(escapeHtml('No special characters')).toBe('No special characters');
      expect(escapeHtml('')).toBe('');
    });
  });
});
