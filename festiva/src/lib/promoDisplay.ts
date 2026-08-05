import type { Lang } from '../i18n/strings'
import type { DiscountType } from '../types/domain'

/** Etichetta breve per il badge di una promozione. */
export function promoBadge(
  discountType: DiscountType,
  value: number | null,
  lang: Lang,
): string {
  switch (discountType) {
    case 'percent':
      return value ? `-${value}%` : lang === 'it' ? 'Sconto' : 'Discount'
    case 'fixed':
      return value ? `-€${value}` : lang === 'it' ? 'Sconto' : 'Discount'
    case 'package':
    default:
      return lang === 'it' ? 'Pacchetto' : 'Package'
  }
}
