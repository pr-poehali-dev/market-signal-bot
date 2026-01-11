import { useState, useEffect, useCallback, useRef } from 'react';
import { RealTimeQuote, MarketAnalysis, StrategyPerformance } from '@/types/trading';

// Симуляция WebSocket подключения к реальным котировкам
// В продакшене заменить на реальный API Pocket Option или другого провайдера
export const useRealTimeMarket = (pairs: string[], updateInterval: number = 1000) => {
  const [quotes, setQuotes] = useState<Record<string, RealTimeQuote>>({});
  const [marketAnalysis, setMarketAnalysis] = useState<Record<string, MarketAnalysis>>({});
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  
  const historicalData = useRef<Record<string, number[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Генерация реалистичных котировок с трендами
  const generateRealisticPrice = useCallback((pair: string, prevPrice?: number) => {
    if (!historicalData.current[pair]) {
      historicalData.current[pair] = [];
    }

    const basePrice = prevPrice || (() => {
      switch (pair) {
        case 'EUR/USD': return 1.0850;
        case 'GBP/USD': return 1.2650;
        case 'USD/JPY': return 148.50;
        case 'AUD/USD': return 0.6750;
        case 'USD/CAD': return 1.3450;
        case 'BTC/USD': return 45000;
        case 'ETH/USD': return 2400;
        default: return 1.0000;
      }
    })();

    // Микротренд (краткосрочный)
    const microTrend = (Math.random() - 0.5) * 0.0002;
    
    // Макротренд (на основе последних 50 свечей)
    const history = historicalData.current[pair].slice(-50);
    let macroTrend = 0;
    if (history.length > 10) {
      const recentAvg = history.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const olderAvg = history.slice(-30, -20).reduce((a, b) => a + b, 0) / 10;
      macroTrend = (recentAvg - olderAvg) / olderAvg * 0.3;
    }

    // Волатильность (зависит от пары)
    const volatilityMultiplier = pair.includes('BTC') || pair.includes('ETH') ? 0.002 : 0.0001;
    const volatility = (Math.random() - 0.5) * volatilityMultiplier;

    // Новая цена
    const change = microTrend + macroTrend + volatility;
    const newPrice = basePrice * (1 + change);

    // Сохранение в историю
    historicalData.current[pair].push(newPrice);
    if (historicalData.current[pair].length > 200) {
      historicalData.current[pair].shift();
    }

    return newPrice;
  }, []);

  // Расчет технических индикаторов в реальном времени
  const calculateIndicators = useCallback((pair: string, price: number): MarketAnalysis['indicators'] => {
    const history = historicalData.current[pair] || [];
    if (history.length < 50) {
      return {
        rsi: 50,
        macd: 0,
        ema: price,
        sma: price,
        stochastic: 50,
        atr: 0.0001,
        adx: 20,
        cci: 0,
        williamsR: -50,
        mfi: 50,
        obv: 0,
        vwap: price,
      };
    }

    const closes = history.slice(-100);
    const volumes = closes.map(() => Math.random() * 1000000); // Симуляция объема

    // RSI (14 периодов)
    const rsiPeriod = 14;
    const changes = closes.slice(1).map((price, i) => price - closes[i]);
    const gains = changes.map(c => c > 0 ? c : 0).slice(-rsiPeriod);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0).slice(-rsiPeriod);
    const avgGain = gains.reduce((a, b) => a + b, 0) / rsiPeriod;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / rsiPeriod;
    const rs = avgGain / (avgLoss || 0.0001);
    const rsi = 100 - (100 / (1 + rs));

    // EMA (12, 26, 9)
    const calculateEMA = (data: number[], period: number) => {
      const k = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      for (let i = period; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
      }
      return ema;
    };

    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macd = ema12 - ema26;

    // SMA (20)
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    // Stochastic (14, 3, 3)
    const stochPeriod = 14;
    const recentPrices = closes.slice(-stochPeriod);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const stochastic = ((price - low) / (high - low || 0.0001)) * 100;

    // ATR (14)
    const atrPeriod = 14;
    const tr = closes.slice(1, -atrPeriod).map((close, i) => {
      const prevClose = closes[i];
      const high = Math.max(close, prevClose);
      const low = Math.min(close, prevClose);
      return high - low;
    });
    const atr = tr.reduce((a, b) => a + b, 0) / atrPeriod;

    // ADX (14)
    const adxPeriod = 14;
    const dm = changes.slice(-adxPeriod).map(c => Math.abs(c));
    const avgDM = dm.reduce((a, b) => a + b, 0) / adxPeriod;
    const adx = (avgDM / (atr || 0.0001)) * 100;

    // CCI (20)
    const cciPeriod = 20;
    const tp = closes.slice(-cciPeriod);
    const tpAvg = tp.reduce((a, b) => a + b, 0) / cciPeriod;
    const meanDev = tp.map(p => Math.abs(p - tpAvg)).reduce((a, b) => a + b, 0) / cciPeriod;
    const cci = (price - tpAvg) / (0.015 * (meanDev || 0.0001));

    // Williams %R (14)
    const wrPeriod = 14;
    const wrPrices = closes.slice(-wrPeriod);
    const wrHigh = Math.max(...wrPrices);
    const wrLow = Math.min(...wrPrices);
    const williamsR = -100 * ((wrHigh - price) / (wrHigh - wrLow || 0.0001));

    // MFI (14) - Money Flow Index
    const mfiPeriod = 14;
    const typicalPrices = closes.slice(-mfiPeriod);
    const mfVolumes = volumes.slice(-mfiPeriod);
    const mfRaw = typicalPrices.map((tp, i) => tp * mfVolumes[i]);
    const positiveMF = mfRaw.filter((_, i) => i > 0 && typicalPrices[i] > typicalPrices[i - 1]).reduce((a, b) => a + b, 0);
    const negativeMF = mfRaw.filter((_, i) => i > 0 && typicalPrices[i] < typicalPrices[i - 1]).reduce((a, b) => a + b, 0);
    const mfRatio = positiveMF / (negativeMF || 0.0001);
    const mfi = 100 - (100 / (1 + mfRatio));

    // OBV - On Balance Volume
    const obv = changes.reduce((acc, change, i) => {
      return acc + (change > 0 ? volumes[i] : change < 0 ? -volumes[i] : 0);
    }, 0);

    // VWAP - Volume Weighted Average Price
    const vwapData = closes.slice(-50).map((c, i) => c * volumes[i]);
    const vwap = vwapData.reduce((a, b) => a + b, 0) / volumes.slice(-50).reduce((a, b) => a + b, 0);

    return {
      rsi,
      macd,
      ema: ema12,
      sma: sma20,
      stochastic,
      atr,
      adx,
      cci,
      williamsR,
      mfi,
      obv,
      vwap,
    };
  }, []);

  // Генерация котировки
  const generateQuote = useCallback((pair: string): RealTimeQuote => {
    const prevQuote = quotes[pair];
    const price = generateRealisticPrice(pair, prevQuote?.price);
    
    const spread = price * 0.0002; // 0.02% спред
    const bid = price - spread / 2;
    const ask = price + spread / 2;

    const history = historicalData.current[pair] || [];
    const high24h = Math.max(...history.slice(-1440), price); // 24ч = 1440 минут
    const low24h = Math.min(...history.slice(-1440), price);

    const prevPrice = prevQuote?.price || price;
    const change = price - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    const volume = (Math.random() * 1000000) + 500000;

    return {
      pair,
      price,
      bid,
      ask,
      spread,
      volume,
      change,
      changePercent,
      timestamp: Date.now(),
      high24h,
      low24h,
    };
  }, [quotes, generateRealisticPrice]);

  // Анализ рынка с использованием 10 стратегий
  const analyzeMarket = useCallback((pair: string, quote: RealTimeQuote): MarketAnalysis => {
    const indicators = calculateIndicators(pair, quote.price);

    // 10 стратегий с весами
    const strategies = [
      {
        name: 'Multi-Timeframe Trend',
        score: (() => {
          const trendScore = indicators.ema > indicators.sma ? 1 : -1;
          const adxBonus = indicators.adx > 30 ? 0.2 : 0;
          return (trendScore + adxBonus) * 10;
        })(),
      },
      {
        name: 'RSI Divergence Pro',
        score: (() => {
          if (indicators.rsi < 25) return 15; // Сильная перепроданность
          if (indicators.rsi > 75) return -15; // Сильная перекупленность
          if (indicators.rsi < 35) return 8;
          if (indicators.rsi > 65) return -8;
          return 0;
        })(),
      },
      {
        name: 'MACD + Volume Surge',
        score: (() => {
          const macdScore = indicators.macd > 0 ? 10 : -10;
          const volumeBonus = quote.volume > 800000 ? 5 : 0;
          return macdScore + volumeBonus;
        })(),
      },
      {
        name: 'Bollinger Band Breakout',
        score: (() => {
          const bandWidth = (indicators.atr / quote.price) * 100;
          if (bandWidth < 0.2) {
            // Сжатие - ожидание пробоя
            return indicators.rsi > 50 ? 12 : -12;
          }
          return 0;
        })(),
      },
      {
        name: 'Stochastic + MFI Combo',
        score: (() => {
          const stochOversold = indicators.stochastic < 20;
          const stochOverbought = indicators.stochastic > 80;
          const mfiConfirm = indicators.mfi < 30 || indicators.mfi > 70;
          
          if (stochOversold && indicators.mfi < 30) return 14;
          if (stochOverbought && indicators.mfi > 70) return -14;
          return 0;
        })(),
      },
      {
        name: 'EMA Crossover Elite',
        score: (() => {
          const emaDiff = ((indicators.ema - indicators.sma) / indicators.sma) * 100;
          return emaDiff > 0.3 ? 13 : emaDiff < -0.3 ? -13 : 0;
        })(),
      },
      {
        name: 'ADX Momentum Power',
        score: (() => {
          if (indicators.adx > 35) {
            return indicators.macd > 0 ? 16 : -16;
          }
          return 0;
        })(),
      },
      {
        name: 'CCI Reversal Hunter',
        score: (() => {
          if (indicators.cci > 200) return -14; // Экстремальная перекупленность
          if (indicators.cci < -200) return 14; // Экстремальная перепроданность
          return 0;
        })(),
      },
      {
        name: 'Williams %R Extreme',
        score: (() => {
          if (indicators.williamsR < -80) return 13; // Перепроданность
          if (indicators.williamsR > -20) return -13; // Перекупленность
          return 0;
        })(),
      },
      {
        name: 'Volatility Breakout Master',
        score: (() => {
          const atrPercent = (indicators.atr / quote.price) * 100;
          if (atrPercent > 0.5 && quote.volume > 900000) {
            return indicators.ema > indicators.sma ? 17 : -17;
          }
          return 0;
        })(),
      },
    ];

    // Выбор лучшей стратегии
    const bestStrategy = strategies.reduce((best, current) => 
      Math.abs(current.score) > Math.abs(best.score) ? current : best
    );

    const totalScore = strategies.reduce((sum, s) => sum + s.score, 0);
    const avgScore = totalScore / strategies.length;

    // Бонусы за согласованность стратегий
    const bullishCount = strategies.filter(s => s.score > 5).length;
    const bearishCount = strategies.filter(s => s.score < -5).length;
    let consensusBonus = 0;
    if (bullishCount >= 6) consensusBonus = 8;
    else if (bullishCount >= 4) consensusBonus = 5;
    else if (bearishCount >= 6) consensusBonus = -8;
    else if (bearishCount >= 4) consensusBonus = -5;

    // Итоговая уверенность
    const baseConfidence = 60;
    const scoreBonus = Math.abs(avgScore) * 2;
    const adxBonus = indicators.adx > 35 ? 7 : indicators.adx > 25 ? 4 : 0;
    const rsiBonus = (indicators.rsi < 25 || indicators.rsi > 75) ? 6 : 0;
    const mfiBonus = (indicators.mfi < 25 || indicators.mfi > 75) ? 5 : 0;

    const confidence = Math.min(98, Math.max(60, 
      baseConfidence + scoreBonus + adxBonus + rsiBonus + mfiBonus + Math.abs(consensusBonus)
    ));

    return {
      pair,
      score: avgScore,
      direction: avgScore > 0 ? 'BUY' : 'SELL',
      strategy: bestStrategy.name,
      indicators,
      confidence,
      lastUpdate: Date.now(),
      priceData: {
        current: quote.price,
        open: historicalData.current[pair]?.[0] || quote.price,
        high: quote.high24h,
        low: quote.low24h,
        volume: quote.volume,
        change: quote.change,
        changePercent: quote.changePercent,
      },
    };
  }, [calculateIndicators]);

  // Обновление производительности стратегий
  const updateStrategyPerformance = useCallback(() => {
    const strategies: StrategyPerformance[] = [
      {
        name: 'Multi-Timeframe Trend',
        winRate: 72 + Math.random() * 8,
        totalTrades: Math.floor(Math.random() * 50) + 100,
        profitFactor: 1.5 + Math.random() * 0.5,
        avgProfit: 8 + Math.random() * 4,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'RSI Divergence Pro',
        winRate: 76 + Math.random() * 6,
        totalTrades: Math.floor(Math.random() * 40) + 80,
        profitFactor: 1.7 + Math.random() * 0.4,
        avgProfit: 10 + Math.random() * 3,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'MACD + Volume Surge',
        winRate: 70 + Math.random() * 10,
        totalTrades: Math.floor(Math.random() * 45) + 90,
        profitFactor: 1.4 + Math.random() * 0.6,
        avgProfit: 7 + Math.random() * 5,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'Bollinger Band Breakout',
        winRate: 74 + Math.random() * 7,
        totalTrades: Math.floor(Math.random() * 35) + 70,
        profitFactor: 1.6 + Math.random() * 0.5,
        avgProfit: 9 + Math.random() * 4,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'Stochastic + MFI Combo',
        winRate: 78 + Math.random() * 5,
        totalTrades: Math.floor(Math.random() * 30) + 60,
        profitFactor: 1.8 + Math.random() * 0.4,
        avgProfit: 11 + Math.random() * 3,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'EMA Crossover Elite',
        winRate: 71 + Math.random() * 9,
        totalTrades: Math.floor(Math.random() * 50) + 100,
        profitFactor: 1.5 + Math.random() * 0.5,
        avgProfit: 8 + Math.random() * 4,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'ADX Momentum Power',
        winRate: 75 + Math.random() * 7,
        totalTrades: Math.floor(Math.random() * 40) + 85,
        profitFactor: 1.7 + Math.random() * 0.4,
        avgProfit: 10 + Math.random() * 3,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'CCI Reversal Hunter',
        winRate: 73 + Math.random() * 8,
        totalTrades: Math.floor(Math.random() * 35) + 75,
        profitFactor: 1.6 + Math.random() * 0.5,
        avgProfit: 9 + Math.random() * 4,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'Williams %R Extreme',
        winRate: 77 + Math.random() * 6,
        totalTrades: Math.floor(Math.random() * 30) + 65,
        profitFactor: 1.7 + Math.random() * 0.4,
        avgProfit: 10 + Math.random() * 3,
        lastUpdate: Date.now(),
        isActive: true,
      },
      {
        name: 'Volatility Breakout Master',
        winRate: 79 + Math.random() * 5,
        totalTrades: Math.floor(Math.random() * 25) + 55,
        profitFactor: 1.9 + Math.random() * 0.3,
        avgProfit: 12 + Math.random() * 3,
        lastUpdate: Date.now(),
        isActive: true,
      },
    ];

    setStrategyPerformance(strategies);
  }, []);

  // Главный цикл обновления
  const updateMarketData = useCallback(() => {
    const newQuotes: Record<string, RealTimeQuote> = {};
    const newAnalysis: Record<string, MarketAnalysis> = {};

    pairs.forEach(pair => {
      const quote = generateQuote(pair);
      const analysis = analyzeMarket(pair, quote);
      
      newQuotes[pair] = quote;
      newAnalysis[pair] = analysis;
    });

    setQuotes(newQuotes);
    setMarketAnalysis(newAnalysis);
    setLastUpdate(Date.now());

    // Обновление производительности стратегий каждые 5 секунд
    if (Date.now() % 5000 < updateInterval) {
      updateStrategyPerformance();
    }
  }, [pairs, generateQuote, analyzeMarket, updateInterval, updateStrategyPerformance]);

  // Запуск обновлений
  useEffect(() => {
    setIsConnected(true);
    
    // Первоначальное обновление
    updateMarketData();
    updateStrategyPerformance();

    // Интервальные обновления
    intervalRef.current = setInterval(updateMarketData, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
    };
  }, [updateMarketData, updateInterval, updateStrategyPerformance]);

  return {
    quotes,
    marketAnalysis,
    strategyPerformance,
    isConnected,
    lastUpdate,
  };
};
