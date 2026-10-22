/**
 * Utility to cleanly format feedback review text for optimal UI presentation.
 * Removes outer quotes and cleans automated test prefixes.
 */
export function formatFeedback(rawText) {
  if (!rawText) return { isAutomated: false, testId: null, content: '' };
  let text = String(rawText).trim();

  // Strip outer quotes if present
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  // Unescape backslashed quotes
  text = text.replace(/\\"/g, '"');

  // Detect and collapse repetitive automated stress test strings
  if (/^(Automated stress test review\.\s*){2,}/i.test(text)) {
    return {
      isAutomated: true,
      testId: 'STRESS-RUN',
      content: 'High-throughput system stress test payload (~3,000 chars verified for pipeline stability).'
    };
  }

  // Detect and parse [Automated Test <id>] prefix
  const match = text.match(/^\[Automated Test\s*([0-9]+)?\]\s*(.*)$/i);
  if (match) {
    return {
      isAutomated: true,
      testId: match[1] || '',
      content: match[2]?.trim() || text
    };
  }

  return {
    isAutomated: false,
    testId: null,
    content: text
  };
}
