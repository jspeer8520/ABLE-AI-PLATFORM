/**
 * Minimal type declarations for `passport-microsoft`, which ships no types.
 * Covers only the surface this service uses.
 */
declare module 'passport-microsoft' {
  import type { Request } from 'express';

  export interface Profile {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    _json?: { mail?: string; userPrincipalName?: string };
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    tenant?: string;
    passReqToCallback?: false;
  }

  export type VerifyCallback = (
    error: Error | null,
    user?: Express.User | false,
    info?: unknown,
  ) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) => void;

  export class Strategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
    authenticate(req: Request, options?: unknown): void;
  }
}
