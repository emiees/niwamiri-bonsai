// Datos conocidos por tipo; Care.specificFields admite además campos de backups futuros.
interface PruningDetails {
  zone?: string
  goal?: string
  intensity?: string
  tool?: string
}
interface TreatmentDetails {
  product?: string
  dose?: number
  doseUnit?: string
  method?: string
}
export interface WireDetail {
  gauge?: number
  zone?: string
}
export interface CareDetailsByType {
  watering: { method?: string; volume?: number; volumeUnit?: string; drainage?: string }
  fertilizing: TreatmentDetails & {
    presentation?: string
    npk?: string
    amount?: number
    amountUnit?: string
  }
  'maintenance-pruning': PruningDetails
  'structural-pruning': PruningDetails & { sealant?: string }
  wiring: { material?: string; wires?: WireDetail[]; reviewDate?: string }
  'wire-removal': {
    zone?: string
    material?: string
    wires?: WireDetail[]
    duration?: number
    durationUnit?: string
    result?: string
  }
  repotting: {
    oldPot?: string
    newPot?: string
    substrate?: string
    rootPercent?: number
    rootCondition?: string
  }
  'root-pruning': {
    rootPercent?: number
    zone?: string
    rootCondition?: string
    substrate?: string
    tool?: string
  }
  defoliation: {
    extent?: string
    zone?: string
    percent?: number
    goal?: string
    regrowthDate?: string
  }
  'pest-treatment': TreatmentDetails & { problem?: string }
  'jin-shari': { technique?: string; zone?: string; product?: string }
  relocation: { oldLocation?: string; newLocation?: string; reason?: string; light?: string }
  observation: { zone?: string; symptoms?: string }
  other: { intervention?: string; details?: string }
}
