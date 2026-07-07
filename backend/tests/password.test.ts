import { hashPassword, verifyPassword } from '../src/services/auth/password.service';

describe('password service', () => {
  it('hashes to a bcrypt hash and verifies the original', async () => {
    const hash = await hashPassword('sup3r-secret');
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    expect(await verifyPassword('sup3r-secret', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
