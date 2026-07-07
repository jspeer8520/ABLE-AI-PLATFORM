import { parseDurationSeconds } from '../src/lib/duration';

describe('parseDurationSeconds', () => {
  it.each([
    ['3600', 3600],
    ['30s', 30],
    ['15m', 900],
    ['2h', 7200],
    ['7d', 604800],
  ])('parses %s', (input, expected) => {
    expect(parseDurationSeconds(input)).toBe(expected);
  });

  it.each(['', 'abc', '10x', 'm5', '1.5h'])('throws on invalid input %s', (input) => {
    expect(() => parseDurationSeconds(input)).toThrow();
  });
});
