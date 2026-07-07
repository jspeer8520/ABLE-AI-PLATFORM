import { extractBearerToken, signAccessToken, signRefreshToken, verifyToken } from '../src/lib/jwt';
import { UnauthorizedError } from '../src/lib/errors';

describe('jwt (RS256)', () => {
  const claims = { sub: 'user_1', email: 'a@b.com', role: 'user' };

  it('signs and verifies an access token, embedding a jti', () => {
    const { token, jti } = signAccessToken(claims);
    const decoded = verifyToken(token, 'access');
    expect(decoded.sub).toBe('user_1');
    expect(decoded.type).toBe('access');
    expect(decoded.jti).toBe(jti);
    expect(decoded.iss).toBe('able-ai-platform');
  });

  it('signs and verifies a refresh token', () => {
    const { token } = signRefreshToken(claims);
    expect(verifyToken(token, 'refresh').type).toBe('refresh');
  });

  it('rejects a token verified as the wrong type', () => {
    const { token } = signAccessToken(claims);
    expect(() => verifyToken(token, 'refresh')).toThrow(UnauthorizedError);
  });

  it('rejects a tampered token', () => {
    const { token } = signAccessToken(claims);
    expect(() => verifyToken(`${token}x`, 'access')).toThrow(UnauthorizedError);
  });

  it('rejects garbage', () => {
    expect(() => verifyToken('not.a.jwt', 'access')).toThrow(UnauthorizedError);
  });

  describe('extractBearerToken', () => {
    it('extracts a valid token', () => {
      expect(extractBearerToken('Bearer abc.def')).toBe('abc.def');
    });
    it('returns null for missing/malformed', () => {
      expect(extractBearerToken(undefined)).toBeNull();
      expect(extractBearerToken('Basic x')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
    });
  });
});
