import { LogEmailService, ResendEmailService } from '../src/services/email/email.service';

const sendMock = jest.fn();

// Mock the Resend SDK so no network call is made.
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => sendMock(...args) },
  })),
}));

describe('email service', () => {
  beforeEach(() => sendMock.mockReset());

  it('LogEmailService resolves without throwing', async () => {
    const svc = new LogEmailService();
    await expect(
      svc.sendVerificationEmail('user@example.com', 'https://x/verify?token=abc'),
    ).resolves.toBeUndefined();
  });

  it('ResendEmailService sends via the Resend client', async () => {
    sendMock.mockResolvedValue({ data: { id: 'e1' }, error: null });
    const svc = new ResendEmailService('re_test');
    await svc.sendVerificationEmail('user@example.com', 'https://x/verify?token=abc');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0]![0] as { to: string; subject: string; html: string };
    expect(payload.to).toBe('user@example.com');
    expect(payload.subject).toMatch(/verify/i);
    expect(payload.html).toContain('https://x/verify?token=abc');
  });

  it('ResendEmailService throws when Resend returns an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'bad key' } });
    const svc = new ResendEmailService('re_test');
    await expect(
      svc.sendVerificationEmail('user@example.com', 'https://x/verify?token=abc'),
    ).rejects.toThrow(/bad key/);
  });
});
