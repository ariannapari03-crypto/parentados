import type { StepDef } from './checklistTypes'

export function reminderChiavi(garage: boolean): StepDef {
  return {
    id: 'reminder-chiavi',
    kind: 'confirm',
    emoji: '🔑',
    label: garage ? 'Prendi le chiavi (compresa quella del garage)' : 'Prendi le chiavi',
  }
}

/** Limone: chiave di casa normale, il garage si apre col telecomando (non con una chiave a parte). */
export function reminderChiaviTelecomandoGarage(): StepDef {
  return {
    id: 'reminder-chiavi',
    kind: 'confirm',
    emoji: '🔑',
    label: 'Prendi le chiavi di casa + il telecomando del garage',
  }
}

/** San Bartolomeo: da casa servono le chiavi di casa e del garage; quelle del garage sono anche nella scatola all'ingresso. */
export function reminderChiaviSanBart(): StepDef {
  return {
    id: 'reminder-chiavi',
    kind: 'confirm',
    emoji: '🔑',
    label:
      'Prendi da casa le chiavi di San Bart e quelle del garage (le chiavi del garage sono anche nella scatola di legno all’ingresso)',
  }
}

export function controllaOggettiDaPortare(): StepDef {
  return {
    id: 'controlla-oggetti',
    kind: 'handoff-check',
    emoji: '🧳',
    label: 'Controlla se c’è qualcosa da portare',
  }
}

export function apriAcqua(): StepDef {
  return {
    id: 'apertura-acqua',
    kind: 'confirm',
    emoji: '🚰',
    label:
      'Apertura acqua: sotto il lavandino del bagno, leva in basso antiorario 45°, leva in alto stesso movimento',
  }
}

/** Limone: niente leve specifiche come al mare, è solo un rubinetto/valvola generica. */
export function apriAcquaSemplice(): StepDef {
  return { id: 'apertura-acqua', kind: 'confirm', emoji: '🚰', label: 'Apertura acqua' }
}

export function chiudiAcqua(): StepDef {
  return {
    id: 'chiusura-acqua',
    kind: 'confirm',
    emoji: '🚰',
    label: 'Chiudi l’acqua (ultima cosa in assoluto!)',
  }
}

/** Limone: il rubinetto di chiusura dell'acqua è in bagno, vicino al wc. */
export function chiudiAcquaLimone(): StepDef {
  return {
    id: 'chiusura-acqua',
    kind: 'confirm',
    emoji: '🚰',
    label: 'Chiudi l’acqua — in bagno, vicino al wc (ultima cosa in assoluto!)',
  }
}

export function apriLuce(): StepDef {
  return { id: 'apertura-luce', kind: 'confirm', emoji: '💡', label: 'Apertura luce (quadro elettrico)' }
}

export function chiudiLuce(): StepDef {
  return { id: 'chiusura-luce', kind: 'confirm', emoji: '💡', label: 'Chiudi la luce' }
}

export function apriGas(): StepDef {
  return { id: 'apertura-gas', kind: 'confirm', emoji: '🔥', label: 'Apertura gas' }
}

export function chiudiGas(): StepDef {
  return { id: 'chiusura-gas', kind: 'confirm', emoji: '🔥', label: 'Chiudi il gas' }
}

export function apriBoiler(): StepDef {
  return { id: 'apertura-boiler', kind: 'confirm', emoji: '♨️', label: 'Apertura boiler' }
}

export function chiudiBoiler(): StepDef {
  return { id: 'chiusura-boiler', kind: 'confirm', emoji: '♨️', label: 'Spegni il boiler (verifica che sia spento)' }
}

export function accendiFrigoFreezer(): StepDef {
  return {
    id: 'chiudi-frigo-freezer',
    kind: 'confirm',
    emoji: '🧊',
    label: 'Accendi frigo e freezer (se erano stati lasciati spenti)',
  }
}

/** Chiusura San Bartolomeo: il frigo resta chiuso e acceso tra un soggiorno e l'altro. */
export function frigoChiusoAcceso(): StepDef {
  return { id: 'frigo-chiuso-acceso', kind: 'confirm', emoji: '🧊', label: 'Lascia il frigo chiuso e acceso' }
}

/** Chiusura Limone: frigo chiuso e acceso, oppure spento e aperto. */
export function frigoChiusoAccesoLimone(): StepDef {
  return {
    id: 'frigo-chiuso-acceso',
    kind: 'confirm',
    emoji: '🧊',
    label: 'Frigo: lascialo chiuso e acceso, oppure spento e aperto',
  }
}

export function lavastoviglieAperta(): StepDef {
  return { id: 'lavastoviglie-aperta', kind: 'confirm', emoji: '🍽️', label: 'Lascia la lavastoviglie aperta' }
}

export function staccaCorrente(): StepDef {
  return { id: 'stacca-corrente', kind: 'confirm', emoji: '🔌', label: 'Stacca la corrente dal quadro' }
}

export function scopriMobili(): StepDef {
  return { id: 'scopri-mobili', kind: 'confirm', emoji: '🛋️', label: 'Scopri i mobili dai teli' }
}

export function faiLetti(): StepDef {
  return { id: 'fai-letti', kind: 'confirm', emoji: '🛏️', label: 'Fai i letti' }
}

export function puliziaCasa(): StepDef {
  return { id: 'pulizia-casa', kind: 'confirm', emoji: '🧹', label: 'Pulisci la casa (o falla pulire) poco prima dell’arrivo' }
}

export function avviaDeumidificatore(): StepDef {
  return { id: 'avvia-deumidificatore', kind: 'confirm', emoji: '💨', label: 'Avvia il deumidificatore' }
}

export function spegniDeumidificatore(): StepDef {
  return { id: 'spegni-deumidificatore', kind: 'confirm', emoji: '💨', label: 'Spegni il deumidificatore' }
}

export function puliziaTerrazzoApertura(): StepDef {
  return {
    id: 'terrazzo-apertura',
    kind: 'confirm',
    emoji: '🌞',
    label: 'Pulizia terrazzo + tira fuori sdraio, sedie, tavolino',
  }
}

export function rimuoviErbacce(): StepDef {
  return {
    id: 'erbacce-terrazzo',
    kind: 'confirm',
    emoji: '🌿',
    label: 'Rimuovi le erbacce dal terrazzo condiviso (task condivisa: fatta qui, risulta fatta anche nell’altro alloggio)',
  }
}

export function avvisaZioRikiTermosifoni(): StepDef {
  return {
    id: 'avvisa-zio-riki',
    kind: 'confirm',
    emoji: '📞',
    label: 'Di’ a zio Riki di accendere i termosifoni',
  }
}

export function attivaTermosifoniRemoto(): StepDef {
  return {
    id: 'termosifoni-remoto',
    kind: 'confirm',
    emoji: '🌡️',
    label: 'Attivazione termosifoni da remoto (prima di partire verso casa)',
  }
}

export function verificaTermosifoni(): StepDef {
  return {
    id: 'termosifoni-verifica',
    kind: 'confirm',
    emoji: '🌡️',
    label: 'Verifica di persona i termosifoni appena arrivati (spesso vanno fuori linea nonostante l’attivazione remota)',
  }
}

/** Bivio lenzuola: lava qui (con sotto-bivio asciutte/non asciutte) vs lava a casa (genera handoff automatico). */
export function lenzuolaBranch(): StepDef[] {
  return [
    { id: 'lenzuola-togli', kind: 'confirm', emoji: '🛏️', label: 'Togli le lenzuola dai letti' },
    {
      id: 'lenzuola-dove',
      kind: 'choice',
      emoji: '🧺',
      label: 'Le lavi qui o le porti a casa?',
      options: [
        { value: 'qui', label: 'Lavo qui' },
        { value: 'casa', label: 'Lavo a casa' },
      ],
    },
    {
      id: 'lenzuola-lavatrice',
      kind: 'confirm',
      emoji: '🧺',
      label: 'Avvia la lavatrice',
      showIf: (a) => a['lenzuola-dove'] === 'qui',
    },
    {
      id: 'lenzuola-stendi',
      kind: 'confirm',
      emoji: '🧺',
      label: 'Stendi il bucato',
      showIf: (a) => a['lenzuola-dove'] === 'qui',
    },
    {
      id: 'lenzuola-asciutte',
      kind: 'choice',
      emoji: '☀️',
      label: 'Prima di uscire: le lenzuola sono asciutte?',
      showIf: (a) => a['lenzuola-dove'] === 'qui',
      options: [
        { value: 'si', label: 'Sì, sono asciutte' },
        { value: 'no', label: 'No, non ancora' },
      ],
    },
    {
      id: 'lenzuola-ritira',
      kind: 'confirm',
      emoji: '🧺',
      label: 'Ritira le lenzuola asciutte',
      showIf: (a) => a['lenzuola-dove'] === 'qui' && a['lenzuola-asciutte'] === 'si',
    },
    {
      id: 'lenzuola-tira-dentro',
      kind: 'confirm',
      emoji: '🧺',
      label: 'Tira dentro lo stendino: le finirai a casa',
      showIf: (a) => a['lenzuola-dove'] === 'qui' && a['lenzuola-asciutte'] === 'no',
    },
    {
      id: 'lenzuola-borse',
      kind: 'confirm',
      emoji: '👜',
      label: 'Prendi le borse delle lenzuola quando stai per uscire',
      showIf: (a) => a['lenzuola-dove'] === 'casa',
      effect: 'create-handoff-lenzuola',
    },
  ]
}

export function ritiraRobaStesaMare(): StepDef {
  return { id: 'ritira-roba-stesa', kind: 'confirm', emoji: '👙', label: 'Ritira la roba stesa (costumi, teli mare)' }
}

/** Limone: niente costumi/teli mare, è montagna. */
export function ritiraRobaStesaMontagna(): StepDef {
  return { id: 'ritira-roba-stesa', kind: 'confirm', emoji: '🧦', label: 'Ritira la roba stesa' }
}

export function differenziataMare(): StepDef {
  return {
    id: 'differenziata',
    kind: 'confirm',
    emoji: '♻️',
    label: 'Butta l’immondizia (differenziata e non) e ricorda di prendere la tessera!',
  }
}

/** Limone: bidoni sul piazzale Bottero, dettaglio sacchi nelle Informazioni di gestione. */
export function differenziataMontagna(): StepDef {
  return {
    id: 'differenziata',
    kind: 'confirm',
    emoji: '♻️',
    label: 'Porta giù l’immondizia ai bidoni sul piazzale Bottero',
  }
}

export function ritiraBidoni(): StepDef {
  return { id: 'ritira-bidoni', kind: 'confirm', emoji: '🗑️', label: 'Ritira i bidoni da fuori (differenziata, indifferenziata, umido)' }
}

export function puliziaBagno(): StepDef {
  return { id: 'pulizia-bagno', kind: 'confirm', emoji: '🚿', label: 'Pulisci il bagno' }
}

export function passaFufi(): StepDef {
  return { id: 'passa-fufi', kind: 'confirm', emoji: '🤖', label: 'Passa il robot aspirapolvere (Fufi)' }
}

/** Limone: niente Fufi, si passa l'aspirapolvere normale. */
export function passaAspirapolvere(): StepDef {
  return { id: 'passa-fufi', kind: 'confirm', emoji: '🧹', label: 'Passa l’aspirapolvere' }
}

export function salutaChiInPiscina(): StepDef {
  return { id: 'saluta-piscina', kind: 'confirm', emoji: '🏊', label: 'Saluta chi è in piscina' }
}

export function chiudiFinestreTapparelle(): StepDef {
  return { id: 'chiudi-finestre', kind: 'confirm', emoji: '🪟', label: 'Chiudi finestre e tapparelle' }
}

export function chiudiFinestreImposte(): StepDef {
  return { id: 'chiudi-finestre', kind: 'confirm', emoji: '🪟', label: 'Chiudi finestre e imposte' }
}

export function chiudiFinestre(): StepDef {
  return { id: 'chiudi-finestre', kind: 'confirm', emoji: '🪟', label: 'Chiudi le finestre' }
}

/**
 * Checklist scorte minime di chiusura (spec 4.5), tono scherzoso.
 * Acqua solo dove serve tenere qualche bottiglia (mare); in montagna basta la carta igienica.
 * Tutto il resto (alimentari, detersivi) si segnala solo se manca.
 */
export function scorteChecklist(includeAcqua = true): StepDef[] {
  const steps: StepDef[] = []
  if (includeAcqua) {
    steps.push({
      id: 'scorte-acqua',
      kind: 'scorte',
      emoji: '💧',
      label: 'C’è un po’ d’acqua? (bastano un paio di bottiglie)',
      options: [
        { value: 'gia', label: 'Sì, c’è' },
        { value: 'comprata', label: 'Appena comprata' },
      ],
    })
  }
  steps.push({
    id: 'scorte-carta-igienica',
    kind: 'scorte',
    emoji: '🧻',
    label: 'C’è la carta igienica? (bastano un paio di rotoli)',
    options: [
      { value: 'gia', label: 'Sì, c’è' },
      { value: 'comprata', label: 'Appena comprata' },
    ],
  })
  steps.push({
    id: 'scorte-altro',
    kind: 'scorte',
    emoji: '🛒',
    label: 'Manca altro da ricomprare? (alimentari, detersivi…) Scrivilo qui, si segnala al ritorno.',
    freeText: true,
  })
  return steps
}

export function svuotaFrigoFreezer(): StepDef {
  return { id: 'svuota-frigo-freezer', kind: 'confirm', emoji: '🧊', label: 'Svuota frigo e freezer, poi lascia il frigo aperto' }
}

export function copriMobili(): StepDef {
  return { id: 'copri-mobili', kind: 'confirm', emoji: '🛋️', label: 'Copri tutti i mobili con i teli' }
}

export function puliziaProfonda(): StepDef {
  return { id: 'pulizia-profonda', kind: 'confirm', emoji: '🧽', label: 'Pulizia profonda di tutta la casa (non solo bagno/Fufi)' }
}

export function portaGiuRobaCasa(): StepDef {
  return { id: 'porta-giu-roba', kind: 'confirm', emoji: '📦', label: 'Porta giù tutto quello che deve tornare a casa' }
}

export function lenzuolaNonRimesse(): StepDef {
  return {
    id: 'lenzuola-non-rimesse',
    kind: 'info',
    emoji: 'ℹ️',
    label: 'Le lenzuola NON vanno rimesse nei letti (restano solo da lavare/portare via)',
  }
}

export function messaggioFinale(): StepDef {
  return {
    id: 'messaggio-finale',
    kind: 'info',
    emoji: '🙏',
    label: 'Amen: il tuo lavoro qui è finito, alla prossima missione.',
  }
}
