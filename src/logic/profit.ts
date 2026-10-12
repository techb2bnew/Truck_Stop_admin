import type { AppSettings, Load, RateEstimate } from '../types'

export interface LoadAnalysis {
  revenue: number
  fuelCost: number
  driverPay: number
  deadheadCost: number
  profit: number
  ratePerMile: number
  totalMiles: number
}

export function analyseLoad(load: Load, rate: number, s: AppSettings, driverPayPerMile = s.driverPayPerMile): LoadAnalysis {
  const totalMiles = load.loadedMiles + load.deadheadMiles
  const fuelCost = totalMiles * s.fuelCostPerMile
  const driverPay = load.loadedMiles * driverPayPerMile
  const deadheadCost = load.deadheadMiles * s.deadheadRatePerMile
  const profit = rate - fuelCost - driverPay - deadheadCost
  return { revenue: rate, fuelCost, driverPay, deadheadCost, profit, ratePerMile: load.loadedMiles ? rate / load.loadedMiles : 0, totalMiles }
}

export function brokerMargin(sell: number, buy: number) {
  const gross = sell - buy
  return { gross, percent: sell ? (gross / sell) * 100 : 0 }
}

export function rateVsEstimate(rate: number, e: RateEstimate | undefined): 'below' | 'inside' | 'above' | 'unknown' {
  if (!e) return 'unknown'
  if (rate < e.low) return 'below'
  if (rate > e.high) return 'above'
  return 'inside'
}
