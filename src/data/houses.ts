import type { House } from '../types/domain'

const LIMONE_INFO_GESTIONE = [
  {
    titolo: 'Gestione immondizia',
    corpo:
      'Niente umido: sacco unico per umido e indifferenziata. Plastica, vetro e carta in qualunque sacco. Bidoni sul piazzale Bottero.',
  },
  {
    titolo: 'Termosifoni',
    corpo: 'Da poco ci sono le valvole automatiche sui termosifoni.',
  },
]

// Config statiche delle case di famiglia (spec sezione 5).
export const HOUSES: House[] = [
  {
    id: 'san-bartolomeo',
    slug: 'san-bartolomeo',
    nome: 'San Bartolomeo',
    emoji: '🏖️',
    colore: '#3e7d92',
    sottotitolo: 'al mare',
    hasGarage: true,
    hasBoiler: false,
    hasGas: false,
    hasDeumidificatore: true,
    hasTerrazzo: true,
    serranda: 'tapparelle',
    supportsInverno: true,
    genericChecklist: false,
    accessoRiservato: false,
    sharedTaskGroupId: null,
    infoGestione: [
      {
        titolo: 'Gestione immondizia',
        corpo:
          'Prendi la tessera in ingresso. Ai bidoni: pulsante, appoggia la carta, pedale e butta. Sacco grigio per l’indifferenziata, sacchetto biodegradabile per l’umido, sacchetto qualsiasi per plastica/carta/vetro.',
      },
      {
        titolo: 'Tessera piscina',
        corpo:
          'È nella scatola di legno all’ingresso. Appendila a una sdraio quando scendi in piscina, poi riportala su.',
      },
      {
        titolo: 'Garage e cancello',
        corpo:
          'A luglio e agosto il garage è a disposizione. Le chiavi del cancello sono nella scatola di legno all’ingresso.',
      },
    ],
  },
  {
    id: 'limone-3',
    slug: 'limone-3',
    nome: 'Limone 3',
    emoji: '🏔️',
    colore: '#6b8e4e',
    sottotitolo: 'in montagna',
    hasGarage: true,
    hasBoiler: true,
    hasGas: true,
    hasDeumidificatore: false,
    hasTerrazzo: true,
    serranda: 'imposte',
    supportsInverno: true,
    genericChecklist: false,
    accessoRiservato: false,
    sharedTaskGroupId: 'erbacce-limone',
    infoGestione: LIMONE_INFO_GESTIONE,
  },
  {
    id: 'limone-9',
    slug: 'limone-9',
    nome: 'Limone 9',
    emoji: '⛰️',
    colore: '#c99b1f',
    sottotitolo: 'in montagna',
    hasGarage: true,
    hasBoiler: true,
    hasGas: true,
    hasDeumidificatore: false,
    hasTerrazzo: true,
    serranda: 'imposte',
    supportsInverno: true,
    genericChecklist: false,
    accessoRiservato: false,
    sharedTaskGroupId: 'erbacce-limone',
    infoGestione: LIMONE_INFO_GESTIONE,
  },
  {
    id: 'sanremo',
    slug: 'sanremo',
    nome: 'Sanremo',
    emoji: '🌺',
    colore: '#c1565a',
    sottotitolo: 'accesso riservato',
    hasGarage: false,
    hasBoiler: false,
    hasGas: false,
    hasDeumidificatore: false,
    hasTerrazzo: false,
    serranda: 'nessuna',
    supportsInverno: true,
    genericChecklist: true,
    accessoRiservato: true,
    sharedTaskGroupId: null,
    infoGestione: [],
  },
]

export function getHouseBySlug(slug: string): House | undefined {
  return HOUSES.find((h) => h.slug === slug)
}

export function getHouseById(id: string): House | undefined {
  return HOUSES.find((h) => h.id === id)
}
