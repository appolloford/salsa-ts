export const toSciSymbol = (num: number, digits: number = 3) => {
  const [coeff, exp] = num.toExponential().split('e').map(item => Number(item));
  return exp === 0 ? `${coeff.toFixed(digits)}` : `${coeff.toFixed(digits)}x10^${exp}`
}