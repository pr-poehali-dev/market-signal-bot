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
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  volumeChange?: number;
  isPreSignal?: boolean;
  countdown?: number;
  strategyUsed?: string;
  winProbability?: number;
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
  minConfidence: number;
  maxConcurrentTrades: number;
  martingaleEnabled: boolean;
  antiDetectEnabled: boolean;
  useSmartRisk: boolean;
  preSignalEnabled: boolean;
  preSignalMinutes: number;
  autoUpdateStrategies: boolean;
  realTimeQuotes: boolean;
  updateInterval: number;
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
  action: 'ANALYZING' | 'TRADE_OPENED' | 'TRADE_CLOSED' | 'WAITING' | 'PRE_SIGNAL' | 'STRATEGY_UPDATE' | 'ANTI_DETECT' | 'QUOTE_UPDATE';
  pair?: string;
  type?: 'BUY' | 'SELL';
  amount?: number;
  reason?: string;
  confidence?: number;
  strategy?: string;
  countdown?: number;
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
    williamsR: number;
    mfi: number;
    obv: number;
    vwap: number;
  };
  confidence: number;
  lastUpdate: number;
  priceData: {
    current: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    change: number;
    changePercent: number;
  };
}

export interface StrategyPerformance {
  name: string;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgProfit: number;
  lastUpdate: number;
  isActive: boolean;
}

export interface RealTimeQuote {
  pair: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: number;
  high24h: number;
  low24h: number;
}