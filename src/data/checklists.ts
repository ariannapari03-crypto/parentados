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
  // inverno — [DA CONFERMARE]
  const steps: StepDef[] = [
    { ...b.reminderChiavi(true), assunto: true },
    { ...b.controllaOggettiDaPortare(), assunto: true },
  ]
  if (ctx.inizioStagione) steps.push({ ...b.puliziaCasa(), assunto: true })
  steps.push({ ...b.apriAcqua(), assunto: true })
  if (ctx.inizioStagione) {
    steps.push({ ...b.apriLuce(), assunto: true })
    steps.push({ ...b.chiudiFrigoFreezer(), assunto: true })
    steps.push({ ...b.scopriMobili(), assunto: true })
    steps.push({ ...b.faiLetti(), assunto: true })
  }
  return steps
}

function sanBartolomeoChiusura(ctx: ChecklistCtx): StepDef[] {
  const isEstate = ctx.stagione === 'estate'
  const steps: StepDef[] = [...b.lenzuolaBranch(), ...b.scorteChecklist()]
  if (isEstate) steps.push(b.ritiraRobaStesa())
  steps.push(b.differenziata(), b.ritiraBidoni(), b.puliziaBagno(), b.passaFufi())
  if (isEstate) {
    steps.push(b.spegniDeumidificatore(), b.salutaChiInPiscina())
  }
  steps.push(b.chiudiFinestreTapparelle())

  const fineAdditions = (assunto: boolean): StepDef[] => [
    { ...b.svuotaFrigoFreezer(), assunto },
    { ...b.copriMobili(), assunto },
    { ...b.puliziaProfonda(), assunto },
    { ...b.portaGiuRobaCasa(), assunto },
    { ...b.chiudiLuce(), assunto },
    { ...b.lenzuolaNonRimesse(), assunto },
  ]
  if (ctx.fineStagione) {
    steps.push(...fineAdditions(!isEstate))
  }
  steps.push(b.chiudiAcqua())
  steps.push(b.messaggioFinale())

  if (!isEstate) return steps.map((s) => ({ ...s, assunto: true }))
  return steps
}

function limoneApertura(ctx: ChecklistCtx): StepDef[] {
  if (ctx.stagione === 'estate' && ctx.inizioStagione) {
    const steps: StepDef[] = [
      b.reminderChiavi(true, true),
      b.controllaOggettiDaPortare(),
      b.apriGas(true),
      b.apriLuce(),
      b.apriBoiler(),
      b.apriAcqua(),
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
      { ...b.puliziaTerrazzoApertura(), assunto: true },
    ]
    return steps
  }
  if (ctx.stagione === 'estate' && !ctx.inizioStagione) {
    return [
      { ...b.reminderChiavi(true, true), assunto: true },
      { ...b.controllaOggettiDaPortare(), assunto: true },
      { ...b.apriAcqua(), assunto: true },
    ]
  }
  // inverno — confermata, si applica ad ogni soggiorno
  return [
    b.reminderChiavi(true, true),
    b.controllaOggettiDaPortare(),
    b.attivaTermosifoniRemoto(),
    b.apriGas(),
    b.apriLuce(),
    b.apriBoiler(),
    b.apriAcqua(),
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
  if (isEstate) steps.push(b.ritiraRobaStesa())
  steps.push(b.differenziata(), b.ritiraBidoni(), b.puliziaBagno(), b.passaFufi())

  if (!isEstate) {
    // inverno: boiler/gas/luce si chiudono ad ogni soggiorno
    steps.push(b.chiudiBoiler(), b.chiudiGas(), b.chiudiLuce())
  }
  steps.push(b.chiudiFinestreImposte())

  if (ctx.fineStagione) {
    if (isEstate) {
      steps.push(b.chiudiBoiler(), b.chiudiGas(), b.chiudiLuce())
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
    b.differenziata(),
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
