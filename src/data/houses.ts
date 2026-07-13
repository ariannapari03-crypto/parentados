import type { House } from '../types/domain'

// Config statiche delle case di famiglia (spec sezione 5).
export const HOUSES: House[] = [
  {
    id: 'san-bartolomeo',
    slug: 'san-bartolomeo',
    nome: 'San Bartolomeo',
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
  },
  {
    id: 'limone-3',
    slug: 'limone-3',
    nome: 'Limone 3',
    hasGarage: true,
    hasBoiler: true,
    hasGas: true,
    hasDeumidificatore: false,
    hasTerrazzo: true,
    serranda: 'simil-imposte',
    supportsInverno: true,
    genericChecklist: false,
    accessoRiservato: false,
    sharedTaskGroupId: 'erbacce-limone',
  },
  {
    id: 'limone-9',
    slug: 'limone-9',
    nome: 'Limone 9',
    hasGarage: true,
    hasBoiler: true,
    hasGas: true,
    hasDeumidificatore: false,
    hasTerrazzo: true,
    serranda: 'simil-imposte',
    supportsInverno: true,
    genericChecklist: false,
    accessoRiservato: false,
    sharedTaskGroupId: 'erbacce-limone',
  },
  {
    id: 'sanremo',
    slug: 'sanremo',
    nome: 'Sanremo',
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
  },
]

export function getHouseBySlug(slug: string): House | undefined {
  return HOUSES.find((h) => h.slug === slug)
}

export function getHouseById(id: string): House | undefined {
  return HOUSES.find((h) => h.id === id)
}
