export interface PerformanceSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
  returnsByPeriod: Record<string, number>;
}

export interface AllocationBreakdown {
  category: string;
  value: number;
  weight: number;
}

export interface RevenueEntry {
  month: string;
  dividends: number;
  interest: number;
  total: number;
}

export interface FeesSummary {
  totalFees: number;
  feesRatio: number;
  feesByAccount: AccountFees[];
}

export interface AccountFees {
  accountName: string;
  fees: number;
}

export interface PortfolioIndicators {
  largestPosition: string | null;
  largestPositionWeight: number;
  distinctPositions: number;
  cashRatio: number;
  investedRatio: number;
}
