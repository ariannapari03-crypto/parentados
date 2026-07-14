import type { ChecklistFlow, House } from '../types/domain'
import type { ChecklistCtx, StepDef } from './checklistTypes'
import * as b from './checklistBuilders'

function sanBartolomeoPrePartenza(): StepDef[] {
  return [b.reminderChiaviSanBart(), b.controllaOggettiDaPortare()]
}

function sanBartolomeoApertura(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'estate' && ctx.inizioStagione) {
    return [
      b.puliziaCasa(),
      b.apriAcqua(),
      b.apriLuce(),
      b.accendiFrigoFreezer(),
      b.scopriMobili(),
      b.faiLetti(),
      b.avviaDeumidificatore(),
      b.puliziaTerrazzoApertura(),
    ]
  }
  if (ctx.stagione === 'estate' && !ctx.inizioStagione) {
    return [b.apriAcqua(), b.avviaDeumidificatore()]
  }
  // inverno
  const steps: StepDef[] = []
  if (ctx.inizioStagione) steps.push(b.puliziaCasa())
  steps.push(b.apriAcqua())
  if (ctx.inizioStagione) {
    steps.push(b.apriLuce(), b.accendiFrigoFreezer(), b.scopriMobili(), b.faiLetti())
  }
  return steps
}

function sanBartolomeoChiusura(ctx: ChecklistCtx): StepDef[] {
  const isEstate = ctx.stagione === 'estate'
  const steps: StepDef[] = [...b.lenzuolaBranch(), ...b.scorteChecklist(true)]
  if (isEstate) steps.push(b.ritiraRobaStesaMare())
  steps.push(b.differenziataMare(), b.ritiraBidoni(), b.puliziaBagno(), b.passaFufi())
  if (isEstate) {
    steps.push(b.spegniDeumidificatore(), b.salutaChiInPiscina())
  }
  steps.push(b.chiudiFinestreTapparelle())

  if (ctx.fineStagione) {
    // fine stagione: casa "spenta" fino alla prossima apertura
    steps.push(
      b.svuotaFrigoFreezer(),
      b.lavastoviglieAperta(),
      b.copriMobili(),
      b.puliziaProfonda(),
      b.portaGiuRobaCasa(),
      b.staccaCorrente(),
      b.lenzuolaNonRimesse(),
    )
  } else {
    // tra un soggiorno e l'altro la casa resta "viva"
    steps.push(b.frigoChiusoAcceso(), b.lavastoviglieAperta())
  }
  steps.push(b.chiudiAcqua())
  steps.push(b.messaggioFinale())
  return steps
}

function limonePrePartenza(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'inverno') {
    return [
      b.avvisaZioRikiTermosifoni(),
      b.reminderChiaviTelecomandoGarage(),
      b.controllaOggettiDaPortare(),
      b.attivaTermosifoniRemoto(),
    ]
  }
  return [b.reminderChiaviTelecomandoGarage(), b.controllaOggettiDaPortare()]
}

function limoneApertura(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'estate' && ctx.inizioStagione) {
    return [
      b.apriGas(),
      b.apriLuce(),
      b.apriBoiler(),
      b.apriAcquaSemplice(),
      b.puliziaCasa(),
      b.scopriMobili(),
      b.faiLetti(),
      b.accendiFrigoFreezer(),
      {
        id: 'erbacce-terrazzo-shared',
        kind: 'shared-task',
        emoji: '🌿',
        label: 'Rimuovi le erbacce dal terrazzo condiviso (solo a inizio stagione estiva)',
        sharedTaskGroupId: 'erbacce-limone',
      },
      b.puliziaTerrazzoApertura(),
    ]
  }
  if (ctx.stagione === 'estate' && !ctx.inizioStagione) {
    return [b.apriAcquaSemplice()]
  }
  // inverno — si applica ad ogni soggiorno
  return [
    b.apriGas(),
    b.apriLuce(),
    b.apriBoiler(),
    b.apriAcquaSemplice(),
    b.verificaTermosifoni(),
    b.puliziaCasa(),
    b.accendiFrigoFreezer(),
    b.scopriMobili(),
    b.faiLetti(),
  ]
}

function limoneChiusura(ctx: ChecklistCtx): StepDef[] {
  const isEstate = ctx.stagione === 'estate'
  // in montagna niente acqua in frigo tra le scorte: basta la carta igienica
  const steps: StepDef[] = [...b.lenzuolaBranch(), ...b.scorteChecklist(false)]
  if (isEstate) steps.push(b.ritiraRobaStesaMontagna())
  steps.push(b.differenziataMontagna(), b.puliziaBagno(), b.passaAspirapolvere())
  // gas e boiler si chiudono/verificano sempre, in ogni chiusura
  steps.push(b.chiudiGas(), b.chiudiBoiler())
  if (!isEstate) {
    // inverno: anche la luce si chiude ad ogni soggiorno
    steps.push(b.chiudiLuce())
  }
  steps.push(b.chiudiFinestreImposte())

  if (ctx.fineStagione) {
    if (isEstate) steps.push(b.chiudiLuce())
    steps.push(b.svuotaFrigoFreezer(), b.lavastoviglieAperta(), b.copriMobili(), b.puliziaProfonda(), b.portaGiuRobaCasa())
    if (isEstate) steps.push(b.lenzuolaNonRimesse())
  } else {
    steps.push(b.frigoChiusoAccesoLimone(), b.lavastoviglieAperta())
  }

  steps.push(b.chiudiAcquaLimone())
  steps.push(b.messaggioFinale())
  return steps
}

function sanremoPrePartenza(): StepDef[] {
  return [b.reminderChiavi(false), b.controllaOggettiDaPortare()]
}

function sanremoApertura(): StepDef[] {
  return [b.apriAcquaSemplice(), b.apriLuce(), b.accendiFrigoFreezer(), b.faiLetti()]
}

function sanremoChiusura(): StepDef[] {
  return [
    ...b.lenzuolaBranch(),
    ...b.scorteChecklist(),
    b.differenziataMare(),
    b.ritiraBidoni(),
    b.puliziaBagno(),
    b.chiudiFinestre(),
    b.chiudiAcqua(),
    b.messaggioFinale(),
  ]
}

export function getChecklistSteps(house: House, flow: ChecklistFlow, ctx: ChecklistCtx): StepDef[] {
  if (house.genericChecklist) {
    if (flow === 'pre-partenza') return sanremoPrePartenza()
    return flow === 'apertura' ? sanremoApertura() : sanremoChiusura()
  }
  if (house.slug === 'san-bartolomeo') {
    if (flow === 'pre-partenza') return sanBartolomeoPrePartenza()
    return flow === 'apertura' ? sanBartolomeoApertura(ctx) : sanBartolomeoChiusura(ctx)
  }
  if (house.slug === 'limone-3' || house.slug === 'limone-9') {
    if (flow === 'pre-partenza') return limonePrePartenza(ctx)
    return flow === 'apertura' ? limoneApertura(ctx) : limoneChiusura(ctx)
  }
  return []
}
