import { TradingSignal, HistoryItem, MarketAnalysis } from '@/types/trading';

export const advancedMarketAnalysis = (chartData: any[], pair: string): MarketAnalysis => {
  const recent = chartData.slice(-100);
  const prices = recent.map(d => d.price);
  const volumes = recent.map(d => d.volume);
  const currentPrice = prices[prices.length - 1];
  
  const calculateEMA = (data: number[], period: number): number => {
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };
  
  const calculateSMA = (data: number[], period: number): number => {
    return data.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, data.length);
  };
  
  const calculateRSI = (prices: number[], period: number = 14): number => {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };
  
  const ema5 = calculateEMA(prices, 5);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const ema50 = calculateEMA(prices, 50);
  const ema100 = calculateEMA(prices, 100);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  
  const rsi = calculateRSI(prices, 14);
  const rsi7 = calculateRSI(prices, 7);
  const rsi21 = calculateRSI(prices, 21);
  
  const macdLine = ema12 - ema26;
  const macdSignal = calculateEMA([macdLine], 9);
  const macdHist = macdLine - macdSignal;
  
  const highs = prices.slice(-14);
  const lows = prices.slice(-14);
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const stochastic = lowestLow === highestHigh ? 50 : 
    ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  const trueRanges = [];
  for (let i = 1; i < prices.length; i++) {
    const tr = Math.max(
      prices[i] - prices[i - 1],
      Math.abs(prices[i] - prices[i - 1]),
      Math.abs(prices[i - 1] - prices[i])
    );
    trueRanges.push(tr);
  }
  const atr = calculateSMA(trueRanges, 14);
  
  let dmPlus = 0, dmMinus = 0, trSum = 0;
  for (let i = prices.length - 14; i < prices.length - 1; i++) {
    const upMove = prices[i + 1] - prices[i];
    const downMove = prices[i] - prices[i + 1];
    const tr = Math.abs(prices[i + 1] - prices[i]);
    trSum += tr;
    if (upMove > downMove && upMove > 0) dmPlus += upMove;
    if (downMove > upMove && downMove > 0) dmMinus += downMove;
  }
  const diPlus = (dmPlus / (trSum + 0.0001)) * 100;
  const diMinus = (dmMinus / (trSum + 0.0001)) * 100;
  const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus + 0.0001) * 100;
  const adx = calculateSMA([dx], 14);
  
  const typicalPrices = prices.map((p, i) => i > 0 ? (p + prices[i - 1]) / 2 : p);
  const smaTP = calculateSMA(typicalPrices, 20);
  const meanDev = typicalPrices.slice(-20).reduce((sum, p) => sum + Math.abs(p - smaTP), 0) / 20;
  const cci = (typicalPrices[typicalPrices.length - 1] - smaTP) / (0.015 * meanDev);
  
  const bbMiddle = sma20;
  const stdDev = Math.sqrt(prices.slice(-20).reduce((sum, p) => sum + Math.pow(p - sma20, 2), 0) / 20);
  const bbUpper = bbMiddle + (stdDev * 2);
  const bbLower = bbMiddle - (stdDev * 2);
  const bbWidth = ((bbUpper - bbLower) / bbMiddle) * 100;
  
  const volumeSMA = calculateSMA(volumes, 20);
  const volumeRatio = volumes[volumes.length - 1] / volumeSMA;
  
  const priceChange1 = ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;
  const priceChange5 = ((currentPrice - prices[prices.length - 6]) / prices[prices.length - 6]) * 100;
  
  const momentum = currentPrice - prices[prices.length - 10];
  const roc = ((currentPrice - prices[prices.length - 10]) / prices[prices.length - 10]) * 100;
  
  const williamsR = ((highestHigh - currentPrice) / (highestHigh - lowestLow)) * -100;
  
  const mfi = (() => {
    let posFlow = 0, negFlow = 0;
    for (let i = prices.length - 14; i < prices.length - 1; i++) {
      const typPrice = (prices[i] + prices[i + 1]) / 2;
      const moneyFlow = typPrice * volumes[i];
      if (prices[i + 1] > prices[i]) posFlow += moneyFlow;
      else negFlow += moneyFlow;
    }
    const mfiRatio = posFlow / (negFlow + 0.0001);
    return 100 - (100 / (1 + mfiRatio));
  })();
  
  const strategies = [
    { 
      name: 'Multi-Timeframe Trend',
      score: (() => {
        let score = 70;
        if (ema5 > ema12 && ema12 > ema26 && ema26 > ema50) score += 15;
        if (currentPrice > sma20 && currentPrice > sma50) score += 10;
        if (adx > 25) score += 8;
        if (volumeRatio > 1.2) score += 5;
        if (macdHist > 0 && macdLine > macdSignal) score += 7;
        return score;
      })(),
      direction: (ema12 > ema26 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'RSI Divergence Pro',
      score: (() => {
        let score = 65;
        if (rsi < 25 || rsi > 75) score += 20;
        if (rsi < 30 || rsi > 70) score += 10;
        if (rsi7 < 20 || rsi7 > 80) score += 8;
        if ((rsi < 30 && macdHist > 0) || (rsi > 70 && macdHist < 0)) score += 12;
        if (adx > 20) score += 5;
        return score;
      })(),
      direction: (rsi < 50 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'MACD + Volume Surge',
      score: (() => {
        let score = 68;
        if (Math.abs(macdHist) > 0.0005) score += 12;
        if (macdLine > 0 && macdLine > macdSignal) score += 10;
        if (volumeRatio > 1.5) score += 15;
        if (volumeRatio > 2.0) score += 10;
        if (adx > 30) score += 8;
        return score;
      })(),
      direction: (macdLine > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Bollinger Band Breakout',
      score: (() => {
        let score = 66;
        if (currentPrice > bbUpper || currentPrice < bbLower) score += 18;
        if (bbWidth < 2) score += 12;
        if (volumeRatio > 1.3) score += 10;
        if (atr > 0.001) score += 8;
        if ((currentPrice > bbUpper && rsi > 60) || (currentPrice < bbLower && rsi < 40)) score += 10;
        return score;
      })(),
      direction: (currentPrice > bbMiddle ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Stochastic + MFI Combo',
      score: (() => {
        let score = 67;
        if (stochastic < 15 || stochastic > 85) score += 18;
        if (stochastic < 20 || stochastic > 80) score += 10;
        if ((stochastic < 20 && mfi < 30) || (stochastic > 80 && mfi > 70)) score += 15;
        if (rsi < 35 || rsi > 65) score += 8;
        return score;
      })(),
      direction: (stochastic < 50 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'EMA Crossover Elite',
      score: (() => {
        let score = 69;
        if (ema5 > ema12 && ema12 > ema26) score += 15;
        const emaDiff = Math.abs(ema12 - ema26) / currentPrice * 100;
        if (emaDiff > 0.3) score += 12;
        if (currentPrice > sma50 && sma50 > sma200) score += 10;
        if (adx > 28) score += 8;
        return score;
      })(),
      direction: (ema12 > ema26 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'ADX Momentum Power',
      score: (() => {
        let score = 64;
        if (adx > 35) score += 20;
        if (adx > 25) score += 10;
        if ((diPlus > diMinus && diPlus > 25) || (diMinus > diPlus && diMinus > 25)) score += 12;
        if (Math.abs(roc) > 1) score += 10;
        if (volumeRatio > 1.4) score += 8;
        return score;
      })(),
      direction: (diPlus > diMinus ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'CCI Reversal Hunter',
      score: (() => {
        let score = 65;
        if (Math.abs(cci) > 200) score += 18;
        if (Math.abs(cci) > 100) score += 10;
        if ((cci > 100 && macdLine > 0) || (cci < -100 && macdLine < 0)) score += 12;
        if (Math.abs(williamsR) < 10 || Math.abs(williamsR + 100) < 10) score += 10;
        return score;
      })(),
      direction: (cci > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Williams %R Extreme',
      score: (() => {
        let score = 66;
        if (williamsR < -80 || williamsR > -20) score += 16;
        if ((williamsR < -80 && rsi < 30) || (williamsR > -20 && rsi > 70)) score += 14;
        if (stochastic < 20 || stochastic > 80) score += 10;
        if (volumeRatio > 1.2) score += 8;
        return score;
      })(),
      direction: (williamsR < -50 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    },
    { 
      name: 'Volatility Breakout Master',
      score: (() => {
        let score = 68;
        const atrPercent = (atr / currentPrice) * 100;
        if (atrPercent > 0.5) score += 15;
        if (bbWidth > 3) score += 12;
        if (volumeRatio > 1.6) score += 12;
        if (Math.abs(priceChange1) > 0.2) score += 10;
        if (adx > 30) score += 8;
        return score;
      })(),
      direction: (priceChange5 > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL'
    }
  ];
  
  const validStrategies = strategies.filter(s => s.score >= 75);
  const sortedStrategies = validStrategies.sort((a, b) => b.score - a.score);
  const bestStrategy = sortedStrategies[0] || strategies.reduce((best, curr) => curr.score > best.score ? curr : best);
  
  const multiStrategyBonus = validStrategies.length >= 3 ? 8 : validStrategies.length >= 2 ? 5 : 0;
  
  const trendAlignment = (() => {
    let alignment = 0;
    if (ema5 > ema12) alignment++;
    if (ema12 > ema26) alignment++;
    if (ema26 > ema50) alignment++;
    if (currentPrice > sma20) alignment++;
    if (currentPrice > sma50) alignment++;
    return alignment;
  })();
  
  const volumeConfirmation = volumeRatio > 1.2 ? 6 : volumeRatio > 1.0 ? 3 : 0;
  const volatilityBonus = atr > 0.001 ? 4 : 0;
  const momentumBonus = Math.abs(momentum) > 0.002 ? 5 : 0;
  
  const confidence = Math.min(98, Math.max(60, Math.floor(
    bestStrategy.score + 
    multiStrategyBonus +
    (trendAlignment * 2) +
    volumeConfirmation +
    volatilityBonus +
    momentumBonus +
    (adx > 30 ? 7 : adx > 25 ? 4 : 0) + 
    (Math.abs(macdHist) > 0.0003 ? 5 : 0) +
    ((rsi < 25 || rsi > 75) ? 6 : (rsi < 30 || rsi > 70) ? 3 : 0) +
    (stochastic < 15 || stochastic > 85 ? 5 : stochastic < 20 || stochastic > 80 ? 3 : 0)
  )));
  
  return {
    pair,
    score: bestStrategy.score,
    direction: bestStrategy.direction,
    strategy: bestStrategy.name,
    indicators: {
      rsi: Math.floor(rsi),
      macd: parseFloat(macdLine.toFixed(5)),
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
    'EUR/GBP', 'NZD/USD', 'USD/CHF', 'BTC/USD', 'ETH/USD',
    'XAU/USD', 'XAG/USD', 'OIL/USD', 'GAS/USD', 'EUR/JPY'
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
  return Array.from({ length: 100 }, (_, i) => {
    const basePrice = 1.1 + Math.random() * 0.02;
    const trend = Math.sin(i / 10) * 0.01;
    const noise = (Math.random() - 0.5) * 0.005;
    return {
      time: new Date(now - (99 - i) * 60000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat((basePrice + trend + noise).toFixed(5)),
      rsi: Math.floor(30 + Math.random() * 40 + Math.sin(i / 5) * 15),
      macd: parseFloat((Math.sin(i / 8) * 0.5).toFixed(3)),
      volume: Math.floor(1000 + Math.random() * 5000 + Math.sin(i / 6) * 1500)
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

export const validateTradeSignal = (analysis: MarketAnalysis, activeTrades: any[], botSettings: any): boolean => {
  if (analysis.confidence < 85) return false;
  
  if (activeTrades.some(t => t.pair === analysis.pair)) return false;
  
  const maxConcurrentTrades = Math.min(5, Math.floor(botSettings.maxTradeAmount / botSettings.minTradeAmount));
  if (activeTrades.length >= maxConcurrentTrades) return false;
  
  if (analysis.indicators.adx < 20) return false;
  
  const strategiesRequiringHighRSI = ['RSI Divergence Pro', 'Stochastic + MFI Combo'];
  if (strategiesRequiringHighRSI.includes(analysis.strategy)) {
    if (analysis.indicators.rsi > 30 && analysis.indicators.rsi < 70) return false;
  }
  
  if (Math.abs(analysis.indicators.macd) < 0.0002) return false;
  
  return true;
};

export const calculateOptimalExpiration = (analysis: MarketAnalysis): number => {
  const adx = analysis.indicators.adx;
  const volatility = Math.abs(analysis.indicators.atr);
  
  if (adx > 40 && volatility > 0.002) return 60;
  if (adx > 30) return 120;
  if (adx > 25) return 180;
  return 300;
};

export const calculateRiskAmount = (
  botSettings: any, 
  analysis: MarketAnalysis, 
  currentBalance: number,
  recentHistory: HistoryItem[]
): number => {
  const baseAmount = botSettings.minTradeAmount;
  
  const confidenceMultiplier = analysis.confidence >= 90 ? 1.5 : analysis.confidence >= 85 ? 1.2 : 1.0;
  
  const recentWins = recentHistory.slice(0, 5).filter(h => h.result === 'WIN').length;
  const streakMultiplier = recentWins >= 4 ? 1.3 : recentWins >= 3 ? 1.1 : recentWins <= 1 ? 0.8 : 1.0;
  
  const adxMultiplier = analysis.indicators.adx > 35 ? 1.2 : analysis.indicators.adx > 25 ? 1.1 : 0.9;
  
  let amount = baseAmount * confidenceMultiplier * streakMultiplier * adxMultiplier;
  
  amount = Math.max(botSettings.minTradeAmount, Math.min(amount, botSettings.maxTradeAmount));
  
  const maxRiskPerTrade = currentBalance * 0.02;
  amount = Math.min(amount, maxRiskPerTrade);
  
  return Math.floor(amount);
};
