import { Currency } from './enums';

export interface Money {
  amount: number; // Integer (always rounded / whole unit)
  currency: Currency;
}

export function createMoney(amount: number, currency: Currency = Currency.IRT): Money {
  if (!Number.isInteger(amount)) {
    throw new Error(`Money amount must be an integer, received: ${amount}`);
  }
  if (amount < 0) {
    throw new Error(`Money amount cannot be negative, received: ${amount}`);
  }
  return { amount, currency };
}

export function formatMoney(money: Money, locale: string = 'fa-IR'): string {
  const formattedNumber = new Intl.NumberFormat(locale).format(money.amount);
  switch (money.currency) {
    case Currency.IRT:
      return `${formattedNumber} تومان`;
    case Currency.IRR:
      return `${formattedNumber} ریال`;
    case Currency.USD:
      return `$${formattedNumber}`;
    case Currency.EUR:
      return `€${formattedNumber}`;
    default:
      return `${formattedNumber} ${money.currency}`;
  }
}

export function formatToman(amount: number, locale: string = 'fa-IR'): string {
  return formatMoney({ amount, currency: Currency.IRT }, locale);
}

export function convertRialToToman(rialAmount: number): number {
  return Math.floor(rialAmount / 10);
}

export function convertTomanToRial(tomanAmount: number): number {
  return tomanAmount * 10;
}

export const rialToToman = convertRialToToman;
export const tomanToRial = convertTomanToRial;
