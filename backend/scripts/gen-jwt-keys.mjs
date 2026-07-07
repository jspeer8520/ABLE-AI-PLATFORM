#!/usr/bin/env node
/**
 * Generates an RS256 keypair and prints base64-encoded PEM values ready to
 * paste into an `.env` file as JWT_PRIVATE_KEY / JWT_PUBLIC_KEY.
 *
 * Usage: node scripts/gen-jwt-keys.mjs
 */
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const b64 = (pem) => Buffer.from(pem).toString('base64');

process.stdout.write(`JWT_PRIVATE_KEY=${b64(privateKey)}\n`);
process.stdout.write(`JWT_PUBLIC_KEY=${b64(publicKey)}\n`);
