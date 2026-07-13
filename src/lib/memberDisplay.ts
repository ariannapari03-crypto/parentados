import type { FamilyMember } from '../types/domain'

// Emoji tra cui scegliere il proprio profilo.
export const PROFILE_EMOJI_OPTIONS = [
  '😎',
  '🧑',
  '👵',
  '👴',
  '🧒',
  '👧',
  '👦',
  '🧔',
  '👩‍🦰',
  '🦸',
  '🧑‍🍳',
  '🏄',
  '🚴',
  '🎨',
  '🐝',
  '🦊',
  '🐧',
  '🐢',
  '🌻',
  '⭐',
]

/** Emoji da mostrare per un membro: la sua scelta, oppure un fallback in base al ruolo. */
export function memberEmoji(member: Pick<FamilyMember, 'emoji' | 'ruolo'> | null | undefined): string {
  if (!member) return '👤'
  if (member.emoji) return member.emoji
  return member.ruolo === 'adulto' ? '🧑' : '🧒'
}
