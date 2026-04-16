import type {
  Layer1Result,
  Layer2Result,
  Layer3Result,
  Layer4Result,
  SystemState,
} from "./types";

export interface CompositeResult {
  score: number;
  state: SystemState;
}

export function computeComposite(
  l1: Layer1Result,
  l2: Layer2Result,
  l3: Layer3Result,
  l4: Layer4Result
): CompositeResult {
  const score = l1.total + l2.total + l3.total + l4.total;

  let state: SystemState;
  if (score <= 7)       state = "normalny";
  else if (score <= 12) state = "pęknięcia";
  else if (score <= 16) state = "zmiana_percepcji";
  else                  state = "ekstremalny";

  return { score, state };
}
