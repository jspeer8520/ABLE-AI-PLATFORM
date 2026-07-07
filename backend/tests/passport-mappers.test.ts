import { mapGoogleProfile, mapMicrosoftProfile } from '../src/config/passport';

describe('OAuth profile mappers', () => {
  it('maps a Google profile with a verified email', () => {
    const result = mapGoogleProfile({
      id: 'g1',
      displayName: 'Ada',
      emails: [{ value: 'ada@example.com' }],
      _json: { email_verified: true },
    } as never);
    expect(result).toEqual({
      provider: 'google',
      providerAccountId: 'g1',
      email: 'ada@example.com',
      name: 'Ada',
      emailVerified: true,
    });
  });

  it('marks a Google email unverified when the provider does not assert email_verified', () => {
    // Missing flag → unverified.
    const missing = mapGoogleProfile({
      id: 'g2',
      displayName: 'Ada',
      emails: [{ value: 'ada@example.com' }],
      _json: {},
    } as never);
    expect(missing.emailVerified).toBe(false);

    // Explicit false → unverified.
    const explicit = mapGoogleProfile({
      id: 'g3',
      emails: [{ value: 'ada@example.com' }],
      _json: { email_verified: false },
    } as never);
    expect(explicit.emailVerified).toBe(false);
  });

  it('throws when Google profile has no email', () => {
    expect(() => mapGoogleProfile({ id: 'g1', emails: [] } as never)).toThrow(/no email/);
  });

  it('maps a Microsoft profile via _json.mail fallback (verified mailbox)', () => {
    const result = mapMicrosoftProfile({
      id: 'm1',
      displayName: 'Grace',
      _json: { mail: 'grace@example.com' },
    } as never);
    expect(result.provider).toBe('microsoft');
    expect(result.email).toBe('grace@example.com');
    expect(result.providerAccountId).toBe('m1');
    // A provisioned mailbox is directory-verified.
    expect(result.emailVerified).toBe(true);
  });

  it('treats a Microsoft userPrincipalName-only email as unverified', () => {
    const result = mapMicrosoftProfile({
      id: 'm2',
      _json: { userPrincipalName: 'upn@example.com' },
    } as never);
    expect(result.email).toBe('upn@example.com');
    // A bare UPN is an identifier, not a verified deliverable address.
    expect(result.emailVerified).toBe(false);
  });

  it('throws when Microsoft profile has no email', () => {
    expect(() => mapMicrosoftProfile({ id: 'm3', _json: {} } as never)).toThrow(/no email/);
  });
});
