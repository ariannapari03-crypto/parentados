import type { House } from '../types/domain'
import type { ChecklistCtx, StepDef } from './checklistTypes'
import * as b from './checklistBuilders'

function sanBartolomeoApertura(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'estate' && ctx.inizioStagione) {
    return [
      b.reminderChiavi(true),
      b.controllaOggettiDaPortare(),
      b.puliziaCasa(),
      b.apriAcqua(),
      b.apriLuce(),
      b.chiudiFrigoFreezer(),
      b.scopriMobili(),
      b.faiLetti(),
      b.avviaDeumidificatore(),
      b.puliziaTerrazzoApertura(),
    ]
  }
  if (ctx.stagione === 'estate' && !ctx.inizioStagione) {
    return [b.reminderChiavi(true), b.controllaOggettiDaPortare(), b.apriAcqua(), b.avviaDeumidificatore()]
  }
  // inverno
  const steps: StepDef[] = [b.reminderChiavi(true), b.controllaOggettiDaPortare()]
  if (ctx.inizioStagione) steps.push(b.puliziaCasa())
  steps.push(b.apriAcqua())
  if (ctx.inizioStagione) {
    steps.push(b.apriLuce(), b.chiudiFrigoFreezer(), b.scopriMobili(), b.faiLetti())
  }
  return steps
}

function sanBartolomeoChiusura(ctx: ChecklistCtx): StepDef[] {
  const isEstate = ctx.stagione === 'estate'
  const steps: StepDef[] = [...b.lenzuolaBranch(), ...b.scorteChecklist()]
  if (isEstate) steps.push(b.ritiraRobaStesaMare())
  steps.push(b.differenziataMare(), b.ritiraBidoni(), b.puliziaBagno(), b.passaFufi())
  if (isEstate) {
    steps.push(b.spegniDeumidificatore(), b.salutaChiInPiscina())
  }
  steps.push(b.chiudiFinestreTapparelle())

  if (ctx.fineStagione) {
    steps.push(
      b.svuotaFrigoFreezer(),
      b.copriMobili(),
      b.puliziaProfonda(),
      b.portaGiuRobaCasa(),
      b.chiudiLuce(),
      b.lenzuolaNonRimesse(),
    )
  }
  steps.push(b.chiudiAcqua())
  steps.push(b.messaggioFinale())
  return steps
}

function limoneApertura(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'estate' && ctx.inizioStagione) {
    return [
      b.reminderChiaviTelecomandoGarage(),
      b.controllaOggettiDaPortare(),
      b.apriGas(),
      b.apriLuce(),
      b.apriBoiler(),
      b.apriAcquaSemplice(),
      b.puliziaCasa(),
      b.scopriMobili(),
      b.faiLetti(),
      b.chiudiFrigoFreezer(),
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
    return [b.reminderChiaviTelecomandoGarage(), b.controllaOggettiDaPortare(), b.apriAcquaSemplice()]
  }
  // inverno — si applica ad ogni soggiorno
  return [
    b.avvisaZioRikiTermosifoni(),
    b.reminderChiaviTelecomandoGarage(),
    b.controllaOggettiDaPortare(),
    b.attivaTermosifoniRemoto(),
    b.apriGas(),
    b.apriLuce(),
    b.apriBoiler(),
    b.apriAcquaSemplice(),
    b.verificaTermosifoni(),
    b.puliziaCasa(),
    b.chiudiFrigoFreezer(),
    b.scopriMobili(),
    b.faiLetti(),
  ]
}

function limoneChiusura(ctx: ChecklistCtx): StepDef[] {
  const isEstate = ctx.stagione === 'estate'
  const steps: StepDef[] = [...b.lenzuolaBranch(), ...b.scorteChecklist()]
  if (isEstate) steps.push(b.ritiraRobaStesaMontagna())
  steps.push(b.differenziataMontagna(), b.puliziaBagno(), b.passaAspirapolvere())
  // il gas si chiude sempre, in ogni chiusura (estate o inverno)
  steps.push(b.chiudiGas())
  if (!isEstate) {
    // inverno: boiler/luce si chiudono ad ogni soggiorno
    steps.push(b.chiudiBoiler(), b.chiudiLuce())
  }
  steps.push(b.chiudiFinestreImposte())

  if (ctx.fineStagione) {
    if (isEstate) {
      steps.push(b.chiudiBoiler(), b.chiudiLuce())
    }
    steps.push(b.svuotaFrigoFreezer(), b.copriMobili(), b.puliziaProfonda(), b.portaGiuRobaCasa())
    if (isEstate) steps.push(b.lenzuolaNonRimesse())
  }

  steps.push(b.chiudiAcqua())
  steps.push(b.messaggioFinale())
  return steps
}

function sanremoApertura(): StepDef[] {
  return [
    b.reminderChiavi(false),
    b.controllaOggettiDaPortare(),
    b.apriAcqua(),
    b.apriLuce(),
    b.chiudiFrigoFreezer(),
    b.faiLetti(),
  ]
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

export function getChecklistSteps(house: House, flow: 'apertura' | 'chiusura', ctx: ChecklistCtx): StepDef[] {
  if (house.genericChecklist) {
    return flow === 'apertura' ? sanremoApertura() : sanremoChiusura()
  }
  if (house.slug === 'san-bartolomeo') {
    return flow === 'apertura' ? sanBartolomeoApertura(ctx) : sanBartolomeoChiusura(ctx)
  }
  if (house.slug === 'limone-3' || house.slug === 'limone-9') {
    return flow === 'apertura' ? limoneApertura(ctx) : limoneChiusura(ctx)
  }
  return []
}
