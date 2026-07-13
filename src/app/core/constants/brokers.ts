export interface Broker {
  value: string;
  label: string;
}

export const TRADITIONAL_BROKERS: Broker[] = [
  { value: 'BNP Paribas',        label: 'BNP Paribas' },
  { value: 'Boursobank',         label: 'Boursobank' },
  { value: 'Bourse Direct',      label: 'Bourse Direct' },
  { value: 'Caisse d\'Épargne',  label: 'Caisse d\'Épargne' },
  { value: 'CIC',                label: 'CIC' },
  { value: 'Crédit Agricole',    label: 'Crédit Agricole' },
  { value: 'Crédit Mutuel',      label: 'Crédit Mutuel' },
  { value: 'De Giro',            label: 'De Giro' },
  { value: 'Fortuneo',           label: 'Fortuneo' },
  { value: 'Freetrade',          label: 'Freetrade' },
  { value: 'Hello Bank',         label: 'Hello Bank' },
  { value: 'HSBC',               label: 'HSBC' },
  { value: 'ING',                label: 'ING' },
  { value: 'Interactive Brokers', label: 'Interactive Brokers' },
  { value: 'La Banque Postale',  label: 'La Banque Postale' },
  { value: 'LCL',                label: 'LCL' },
  { value: 'Linxea',             label: 'Linxea' },
  { value: 'Lydia',              label: 'Lydia' },
  { value: 'N26',                label: 'N26' },
  { value: 'Nalo',               label: 'Nalo' },
  { value: 'Revolut',            label: 'Revolut' },
  { value: 'Saxo Bank',          label: 'Saxo Bank' },
  { value: 'Société Générale',   label: 'Société Générale' },
  { value: 'Swissquote',         label: 'Swissquote' },
  { value: 'Trade Republic',     label: 'Trade Republic' },
  { value: 'Yomoni',             label: 'Yomoni' },
].sort((a, b) => a.label.localeCompare(b.label, 'fr'));

export const CRYPTO_BROKERS: Broker[] = [
  { value: 'Binance',    label: 'Binance' },
  { value: 'Bitfinex',   label: 'Bitfinex' },
  { value: 'Bitstamp',   label: 'Bitstamp' },
  { value: 'Bybit',      label: 'Bybit' },
  { value: 'Coinbase',   label: 'Coinbase' },
  { value: 'Crypto.com', label: 'Crypto.com' },
  { value: 'Gemini',     label: 'Gemini' },
  { value: 'Kraken',     label: 'Kraken' },
  { value: 'Ledger',     label: 'Ledger' },
  { value: 'OKX',        label: 'OKX' },
  { value: 'Trezor',     label: 'Trezor' },
].sort((a, b) => a.label.localeCompare(b.label, 'fr'));

export const OTHER_BROKER: Broker = { value: 'Other', label: 'Other' };

export function getBrokersForAccountType(accountType: string | null): Broker[] {
  if (accountType === 'CRYPTO_WALLET') {
    return [...CRYPTO_BROKERS, OTHER_BROKER];
  }
  return [...TRADITIONAL_BROKERS, OTHER_BROKER];
}
