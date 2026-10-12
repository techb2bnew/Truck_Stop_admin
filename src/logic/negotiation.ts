import type { NegotiationRule } from '../types'

// Rule-based negotiation. Moves to an Edge Function when Supabase is connected.
export interface NegotiationReply {
  status: 'accepted' | 'counter' | 'rejected'
  counter?: number
  message: string
  ended: boolean
}

export function respond(rule: NegotiationRule, offer: number, round: number): NegotiationReply {
  if (offer <= rule.targetRate) {
    return { status: 'accepted', message: rule.acceptMessage, ended: true }
  }
  const ceiling = Math.min(rule.maxRate, Math.round(rule.targetRate * (1 + (rule.stepPercent / 100) * round)))
  if (offer <= ceiling) {
    return { status: 'accepted', message: rule.acceptMessage, ended: true }
  }
  if (round >= rule.maxRounds) {
    return { status: 'rejected', message: rule.rejectMessage, ended: true }
  }
  return { status: 'counter', counter: ceiling, message: rule.counterMessage, ended: false }
}
