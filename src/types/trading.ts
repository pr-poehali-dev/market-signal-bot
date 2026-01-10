export interface TradingSignal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  marketType: 'CLASSIC' | 'OTC';
  successRate: number;
  expiration: number;
  timeToSignal: number;
  rsi: number;
  macd: number;
  bollingerPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  isActive: boolean;
  openPrice?: number;
}

export interface BotSettings {
  isEnabled: boolean;
  accountId: string;
  isDemoAccount: boolean;
  minTradeAmount: number;
  maxTradeAmount: number;
  stopLossAmount: number;
  allowedIPs: string[];
  autoStrategy: boolean;
  currentStrategy: string;
}

export interface HistoryItem {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  result: 'WIN' | 'LOSS';
  profit: number;
  timestamp: string;
}

export interface BotLog {
  id: string;
  timestamp: string;
  action: 'ANALYZING' | 'TRADE_OPENED' | 'TRADE_CLOSED' | 'WAITING';
  pair?: string;
  type?: 'BUY' | 'SELL';
  amount?: number;
  reason?: string;
}

export interface ActiveTrade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  openPrice: number;
  expiration: number;
  timeLeft: number;
  successRate: number;
  strategy: string;
}

export interface MarketAnalysis {
  pair: string;
  score: number;
  direction: 'BUY' | 'SELL';
  strategy: string;
  indicators: {
    rsi: number;
    macd: number;
    ema: number;
    sma: number;
    stochastic: number;
    atr: number;
    adx: number;
    cci: number;
  };
  confidence: number;
}
