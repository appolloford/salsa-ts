export const toSciSymbol = (num: number, digits: number = 3) => {
  if (!num) {
    num = 0.0;
    return num.toFixed(digits);
  }
  const [coeff, exp] = num.toExponential().split('e').map(item => Number(item));
  return exp === 0 ? `${coeff.toFixed(digits)}` : `${coeff.toFixed(digits)}x10^${exp}`;
}