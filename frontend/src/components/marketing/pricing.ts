export type Billing = 'monthly' | 'yearly' | '3year' | '5year';

export const starterPrices: Record<Billing, number> = {
  monthly: 29,
  yearly: 26.1,
  '3year': 23.2,
  '5year': 20.3,
};

export const proPrices: Record<Billing, number> = {
  monthly: 39,
  yearly: 35.1,
  '3year': 31.2,
  '5year': 27.3,
};

export const subLabels: Record<Billing, string> = {
  monthly: 'Maandelijks opzegbaar',
  yearly: 'Jaarlijks gefactureerd',
  '3year': 'Driejaarlijks gefactureerd',
  '5year': 'Vijfjaarlijks gefactureerd',
};

export const billingOptions: { key: Billing; label: string; badge?: string }[] = [
  { key: 'monthly', label: 'Maandelijks' },
  { key: 'yearly', label: 'Jaarlijks', badge: '-10%' },
  { key: '3year', label: '3 jaar', badge: '-20%' },
  { key: '5year', label: '5 jaar', badge: '-30%' },
];
