declare module 'simple-statistics' {
  export function linearRegression(data: number[][]): { m: number; b: number };
  export function linearRegressionLine(mb: { m: number; b: number }): (x: number) => number;
}
