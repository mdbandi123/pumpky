export type BasketStyleId = 'pumpkin' | 'ghost' | 'monster';
export type BasketStyle = {
  id: BasketStyleId;
  name: string;
  subtitle: string;
  color: string;
};

export const basketStyles: readonly BasketStyle[] = [
  { id: 'pumpkin', name: 'Jack', subtitle: 'The classic haunt', color: '#fa853d' },
  { id: 'ghost', name: 'Boo', subtitle: 'Soft little spirit', color: '#d8cbea' },
  { id: 'monster', name: 'Goblin', subtitle: 'Up to no good', color: '#b9dc73' },
];
