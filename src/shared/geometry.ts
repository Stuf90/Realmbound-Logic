export interface GridPosition {
  row: number;
  column: number;
}

export function positionKey({ row, column }: GridPosition): string {
  return `${row}:${column}`;
}
