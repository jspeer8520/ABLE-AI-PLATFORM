import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../src/lib/errors';

describe('error hierarchy', () => {
  it('AppError carries status, code, and operational flag', () => {
    const err = new AppError('boom', 500, 'INTERNAL_ERROR', { hint: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err.details).toEqual({ hint: 'x' });
  });

  it.each([
    [new BadRequestError(), 400, 'BAD_REQUEST'],
    [new UnauthorizedError(), 401, 'UNAUTHORIZED'],
    [new ForbiddenError(), 403, 'FORBIDDEN'],
    [new NotFoundError(), 404, 'NOT_FOUND'],
    [new ValidationError(), 422, 'VALIDATION_ERROR'],
  ])('%s maps to the correct status and code', (err, status, code) => {
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(status);
    expect(err.code).toBe(code);
  });
});
