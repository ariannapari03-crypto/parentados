import { createHmac, timingSafeEqual } from 'node:crypto';

// Protezione della revisione con una sola password (REVISIONE_PASSWORD, da
// ambiente). Il cookie non contiene la password ma un token HMAC derivato: chi
// legge il cookie non ricava la password. Se la password non è configurata,
// l'accesso è negato per default (la revisione resta chiusa).

const MESSAGGIO = 'capitolo-revisione-v1';
export const NOME_COOKIE = 'revisione';

function password(): string | null {
  const p = process.env.REVISIONE_PASSWORD;
  return p && p.length > 0 ? p : null;
}

export function revisioneConfigurata(): boolean {
  return password() !== null;
}

export function tokenAtteso(): string | null {
  const p = password();
  if (!p) return null;
  return createHmac('sha256', p).update(MESSAGGIO).digest('hex');
}

function confrontoCostante(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Verifica la password inserita; se giusta restituisce il token da mettere nel
// cookie, altrimenti null.
export function verificaPassword(input: string): string | null {
  const p = password();
  if (!p) return null;
  return confrontoCostante(input, p) ? tokenAtteso() : null;
}

export function haAccesso(cookieVal: string | undefined): boolean {
  const atteso = tokenAtteso();
  if (!atteso || !cookieVal) return false;
  return confrontoCostante(cookieVal, atteso);
}
