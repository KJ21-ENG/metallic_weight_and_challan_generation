export function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000; // 3 decimals
}

export function computeTareKg(bobQty: number, bobWeightKg: number, boxWeightKg: number): number {
  const tare = bobQty * bobWeightKg + boxWeightKg;
  return roundKg(tare);
}

export function computeNetKg(grossKg: number, tareKg: number): number {
  return roundKg(grossKg - tareKg);
}
