'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { NOME_COOKIE, verificaPassword, haAccesso } from '@/lib/auth';
import {
  confermaScadenza, scartaScadenza, correggiScadenza,
  confermaRegola, scartaRegola, correggiRegola,
  type CorrezioneScadenza, type CorrezioneRegola,
} from '@/lib/revisione';

async function assicuraAccesso(): Promise<void> {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    throw new Error('Non autorizzato: sessione di revisione scaduta o assente.');
  }
}

export async function accedi(
  _prec: { errore?: string } | undefined,
  formData: FormData
): Promise<{ errore?: string }> {
  const token = verificaPassword(String(formData.get('password') ?? ''));
  if (!token) return { errore: 'Password errata o revisione non configurata.' };
  const c = await cookies();
  c.set(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/revisione',
    maxAge: 60 * 60 * 8, // 8 ore
  });
  redirect('/revisione');
}

export async function esci(): Promise<void> {
  const c = await cookies();
  c.delete(NOME_COOKIE);
  redirect('/revisione');
}

// --- azioni sulle proposte (ognuna verifica l'accesso) ---

export async function azConfermaScadenza(id: number): Promise<void> {
  await assicuraAccesso();
  await confermaScadenza(id);
  revalidatePath('/revisione');
}
export async function azScartaScadenza(id: number): Promise<void> {
  await assicuraAccesso();
  await scartaScadenza(id);
  revalidatePath('/revisione');
}
export async function azCorreggiScadenza(id: number, patch: CorrezioneScadenza): Promise<void> {
  await assicuraAccesso();
  await correggiScadenza(id, patch);
  revalidatePath('/revisione');
}

export async function azConfermaRegola(id: number): Promise<void> {
  await assicuraAccesso();
  await confermaRegola(id);
  revalidatePath('/revisione');
}
export async function azScartaRegola(id: number): Promise<void> {
  await assicuraAccesso();
  await scartaRegola(id);
  revalidatePath('/revisione');
}
export async function azCorreggiRegola(id: number, patch: CorrezioneRegola): Promise<void> {
  await assicuraAccesso();
  await correggiRegola(id, patch);
  revalidatePath('/revisione');
}
