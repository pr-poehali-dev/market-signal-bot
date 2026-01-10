import { TradingSignal, HistoryItem, MarketAnalysis } from '@/types/trading';

export const advancedMarketAnalysis = (chartData: any[], pair: string): MarketAnalysis => {
  const recent = chartData.slice(-50);
  const prices = recent.map(d => d.price);
  const volumes = recent.map(d => d.volume);
  const currentPrice = prices[prices.length - 1];
  
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, prices.length);
  
  const rsi = recent[recent.length - 1].rsi;
  const macd = recent[recent.length - 1].macd;
  
  const highs = prices.slice(-14).map((_, i, arr) => Math.max(...arr.slice(Math.max(0, i - 5), i + 1)));
  const lows = prices.slice(-14).map((_, i, arr) => Math.min(...arr.slice(Math.max(0, i - 5), i + 1)));
  const stochastic = lows[lows.length - 1] === highs[highs.length - 1] ? 50 : 
    ((currentPrice - lows[lows.length - 1]) / (highs[highs.length - 1] - lows[lows.length - 1])) * 100;
  
  const tr = Math.max(prices[prices.length - 1] - prices[prices.length - 2], 
    Math.abs(prices[prices.length - 1] - prices[prices.length - 2]));
  const atr = tr * 0.7 + (prices[prices.length - 1] * 0.02);
  
  let dmPlus = 0, dmMinus = 0;
  for (let i = prices.length - 14; i < prices.length; i++) {
    const upMove = prices[i] - prices[i - 1];
    const downMove = prices[i - 1] - prices[i];
    if (upMove > downMove && upMove > 0) dmPlus += upMove;
    if (downMove > upMove && downMove > 0) dmMinus += downMove;
  }
  const adx = Math.abs(dmPlus - dmMinus) / (dmPlus + dmMinus + 0.0001) * 100;
  
  const typicalPrice = (prices[prices.length - 1] + prices[prices.length - 2]) / 2;
  const smaTP = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const meanDev = prices.slice(-20).reduce((sum, p) => sum + Math.abs(p - smaTP), 0) / 20;
  const cci = (typicalPrice - smaTP) / (0.015 * meanDev);
  
  const strategies = [
    { 
      name: 'RSI Reversal', 
      score: (rsi < 30 ? 95 : rsi > 70 ? 92 : 70) + (Math.abs(macd) > 0.3 ? 5 : 0),
      direction: (rsi < 30 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'MACD Crossover', 
      score: (Math.abs(macd) > 0.4 ? 90 : 75) + (adx > 25 ? 8 : 0),
      direction: (macd > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'EMA Trend', 
      score: (Math.abs(ema12 - ema26) > 0.005 ? 88 : 72) + (currentPrice > sma20 ? 7 : 0),
      direction: (ema12 > ema26 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Stochastic Momentum', 
      score: (stochastic < 20 || stochastic > 80 ? 93 : 74) + (rsi < 35 || rsi > 65 ? 6 : 0),
      direction: (stochastic < 20 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Bollinger Breakout', 
      score: (atr > 0.01 ? 91 : 76) + (adx > 30 ? 9 : 0),
      direction: (currentPrice > sma20 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'CCI Divergence', 
      score: (Math.abs(cci) > 100 ? 89 : 73) + (macd * cci > 0 ? 8 : 0),
      direction: (cci > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    }
  ];
  
  const bestStrategy = strategies.reduce((best, curr) => curr.score > best.score ? curr : best);
  
  const confidence = Math.min(95, Math.floor(
    (bestStrategy.score + 
    (adx > 25 ? 5 : 0) + 
    (Math.abs(macd) > 0.3 ? 3 : 0) +
    ((rsi < 30 || rsi > 70) ? 4 : 0) +
    (stochastic < 20 || stochastic > 80 ? 3 : 0)) * 0.95
  ));
  
  return {
    pair,
    score: bestStrategy.score,
    direction: bestStrategy.direction,
    strategy: bestStrategy.name,
    indicators: {
      rsi: Math.floor(rsi),
      macd: parseFloat(macd.toFixed(3)),
      ema: parseFloat((ema12 - ema26).toFixed(5)),
      sma: parseFloat((currentPrice - sma20).toFixed(5)),
      stochastic: Math.floor(stochastic),
      atr: parseFloat(atr.toFixed(5)),
      adx: Math.floor(adx),
      cci: Math.floor(cci)
    },
    confidence
  };
};

export const generateMockSignals = (): TradingSignal[] => {
  const pairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
    'EUR/GBP', 'BTC/USD', 'ETH/USD', 'XAU/USD', 'OIL/USD'
  ];
  
  return pairs.map((pair, index) => ({
    id: `signal-${index}`,
    pair,
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    marketType: index % 3 === 0 ? 'OTC' : 'CLASSIC',
    successRate: Math.floor(72 + Math.random() * 23),
    expiration: [60, 120, 180, 300][Math.floor(Math.random() * 4)],
    timeToSignal: Math.floor(30 + Math.random() * 30),
    rsi: Math.floor(30 + Math.random() * 40),
    macd: parseFloat((Math.random() * 2 - 1).toFixed(2)),
    bollingerPosition: ['UPPER', 'MIDDLE', 'LOWER'][Math.floor(Math.random() * 3)] as any,
    isActive: Math.random() > 0.3
  }));
};

export const generateMockHistory = (): HistoryItem[] => {
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD'];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `history-${i}`,
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    result: Math.random() > 0.35 ? 'WIN' : 'LOSS',
    profit: parseFloat((Math.random() * 200 - 50).toFixed(2)),
    timestamp: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('ru-RU')
  }));
};

export const generateChartData = (pair: string) => {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    const basePrice = 1.1 + Math.random() * 0.02;
    const trend = Math.sin(i / 10) * 0.01;
    return {
      time: new Date(now - (59 - i) * 60000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat((basePrice + trend + (Math.random() - 0.5) * 0.005).toFixed(5)),
      rsi: Math.floor(30 + Math.random() * 40 + Math.sin(i / 5) * 15),
      macd: parseFloat((Math.sin(i / 8) * 0.5).toFixed(3)),
      volume: Math.floor(1000 + Math.random() * 5000)
    };
  });
};

export const generateNewSignal = (oldSignal: TradingSignal, chartData: any[]): TradingSignal => {
  const analysis = advancedMarketAnalysis(chartData, oldSignal.pair);
  
  return {
    ...oldSignal,
    type: analysis.direction,
    successRate: analysis.confidence,
    expiration: [60, 120, 180, 300][Math.floor(Math.random() * 4)],
    timeToSignal: Math.floor(45 + Math.random() * 180),
    rsi: analysis.indicators.rsi,
    macd: analysis.indicators.macd,
    bollingerPosition: ['UPPER', 'MIDDLE', 'LOWER'][Math.floor(Math.random() * 3)] as any,
    isActive: true,
    openPrice: undefined
  };
};
