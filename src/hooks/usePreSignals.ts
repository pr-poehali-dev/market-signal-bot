import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingSignal, MarketAnalysis } from '@/types/trading';
import { toast } from 'sonner';

interface PreSignalSettings {
  enabled: boolean;
  minutesBefore: number;
  minConfidence: number;
}

export const usePreSignals = (
  marketAnalysis: Record<string, MarketAnalysis>,
  settings: PreSignalSettings
) => {
  const [preSignals, setPreSignals] = useState<TradingSignal[]>([]);
  const [upcomingSignals, setUpcomingSignals] = useState<TradingSignal[]>([]);
  const notifiedSignals = useRef<Set<string>>(new Set());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // Расчет оптимальной экспирации на основе ADX и волатильности
  const calculateOptimalExpiration = useCallback((analysis: MarketAnalysis): number => {
    const adx = analysis.indicators.adx;
    const atr = analysis.indicators.atr;
    const price = analysis.priceData.current;
    const volatilityPercent = (atr / price) * 100;

    // Высокая волатильность + сильный тренд = короткая экспирация (скальпинг)
    if (adx > 40 && volatilityPercent > 0.002) {
      return 60; // 1 минута
    }
    
    // Сильный тренд = средняя экспирация
    if (adx > 30) {
      return 120; // 2 минуты
    }
    
    // Умеренный тренд = стандартная экспирация
    if (adx > 25) {
      return 180; // 3 минуты
    }
    
    // Слабый тренд = длинная экспирация
    return 300; // 5 минут
  }, []);

  // Предсказание будущего сигнала на основе текущих трендов
  const predictUpcomingSignal = useCallback((
    pair: string,
    analysis: MarketAnalysis,
    minutesAhead: number
  ): TradingSignal | null => {
    // Проверка уверенности
    if (analysis.confidence < settings.minConfidence) {
      return null;
    }

    // Проверка силы тренда (ADX >= 20)
    if (analysis.indicators.adx < 20) {
      return null;
    }

    // Проверка MACD для подтверждения
    if (Math.abs(analysis.indicators.macd) < 0.0002) {
      return null;
    }

    // Расчет вероятности успеха на основе согласованности индикаторов
    const indicators = analysis.indicators;
    let winProbability = analysis.confidence;

    // Бонусы за экстремальные значения
    if (indicators.rsi < 25 || indicators.rsi > 75) winProbability += 5;
    if (indicators.stochastic < 20 || indicators.stochastic > 80) winProbability += 4;
    if (indicators.mfi < 25 || indicators.mfi > 75) winProbability += 4;
    if (indicators.williamsR < -80 || indicators.williamsR > -20) winProbability += 3;
    if (Math.abs(indicators.cci) > 150) winProbability += 4;

    // Бонус за сильный тренд
    if (indicators.adx > 35) winProbability += 6;
    else if (indicators.adx > 25) winProbability += 3;

    // Ограничение вероятности
    winProbability = Math.min(98, Math.max(75, winProbability));

    // Только высоковероятные сигналы (≥85%)
    if (winProbability < 85) {
      return null;
    }

    const expiration = calculateOptimalExpiration(analysis);
    const timeToSignal = minutesAhead * 60; // в секундах

    return {
      id: `pre-${pair}-${Date.now()}`,
      pair,
      type: analysis.direction,
      marketType: pair.includes('BTC') || pair.includes('ETH') ? 'CLASSIC' : 'OTC',
      successRate: winProbability,
      expiration,
      timeToSignal,
      rsi: indicators.rsi,
      macd: indicators.macd,
      bollingerPosition: (() => {
        const price = analysis.priceData.current;
        const sma = indicators.sma;
        const atr = indicators.atr;
        const upperBand = sma + (2 * atr);
        const lowerBand = sma - (2 * atr);
        
        if (price > upperBand) return 'UPPER';
        if (price < lowerBand) return 'LOWER';
        return 'MIDDLE';
      })(),
      isActive: false,
      isPreSignal: true,
      countdown: timeToSignal,
      currentPrice: analysis.priceData.current,
      priceChange: analysis.priceData.change,
      priceChangePercent: analysis.priceData.changePercent,
      volume: analysis.priceData.volume,
      strategyUsed: analysis.strategy,
      winProbability,
    };
  }, [settings.minConfidence, calculateOptimalExpiration]);

  // Проверка и генерация предварительных сигналов
  const checkForPreSignals = useCallback(() => {
    if (!settings.enabled) {
      setPreSignals([]);
      setUpcomingSignals([]);
      return;
    }

    const newPreSignals: TradingSignal[] = [];
    const newUpcomingSignals: TradingSignal[] = [];

    Object.entries(marketAnalysis).forEach(([pair, analysis]) => {
      // Предсигнал за N минут
      const preSignal = predictUpcomingSignal(pair, analysis, settings.minutesBefore);
      
      if (preSignal) {
        // Проверяем, не дублируется ли сигнал
        const signalKey = `${pair}-${preSignal.type}-${Math.floor(Date.now() / 30000)}`;
        
        if (!notifiedSignals.current.has(signalKey)) {
          newPreSignals.push(preSignal);
          
          // Уведомление о высоковероятном сигнале
          if (preSignal.winProbability! >= 90) {
            toast.success(`🎯 Предсигнал: ${pair}`, {
              description: `${preSignal.type} • ${preSignal.winProbability?.toFixed(1)}% уверенность • Через ${settings.minutesBefore} мин`,
              duration: 5000,
            });
            notifiedSignals.current.add(signalKey);
          }
        }

        // Сигналы на ближайшие 5 минут для мониторинга
        for (let i = 1; i <= 5; i++) {
          const upcomingSignal = predictUpcomingSignal(pair, analysis, i);
          if (upcomingSignal && upcomingSignal.winProbability! >= 85) {
            newUpcomingSignals.push({
              ...upcomingSignal,
              countdown: i * 60,
              timeToSignal: i * 60,
            });
          }
        }
      }
    });

    // Сортировка по вероятности успеха
    newPreSignals.sort((a, b) => (b.winProbability || 0) - (a.winProbability || 0));
    newUpcomingSignals.sort((a, b) => (b.winProbability || 0) - (a.winProbability || 0));

    setPreSignals(newPreSignals);
    setUpcomingSignals(newUpcomingSignals.slice(0, 10)); // Топ-10

    // Очистка старых уведомлений (старше 1 минуты)
    const now = Date.now();
    notifiedSignals.current.forEach(key => {
      const timestamp = parseInt(key.split('-').pop() || '0') * 30000;
      if (now - timestamp > 60000) {
        notifiedSignals.current.delete(key);
      }
    });
  }, [marketAnalysis, settings, predictUpcomingSignal]);

  // Обновление обратного отсчета
  const updateCountdowns = useCallback(() => {
    setPreSignals(prev => prev.map(signal => ({
      ...signal,
      countdown: Math.max(0, (signal.countdown || signal.timeToSignal) - 1),
    })));

    setUpcomingSignals(prev => prev.map(signal => ({
      ...signal,
      countdown: Math.max(0, (signal.countdown || signal.timeToSignal) - 1),
    })));
  }, []);

  // Запуск проверок
  useEffect(() => {
    if (!settings.enabled) {
      return;
    }

    // Проверка каждые 5 секунд
    checkForPreSignals();
    checkInterval.current = setInterval(checkForPreSignals, 5000);

    // Обновление обратного отсчета каждую секунду
    const countdownInterval = setInterval(updateCountdowns, 1000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      clearInterval(countdownInterval);
    };
  }, [settings.enabled, checkForPreSignals, updateCountdowns]);

  // Активация сигнала (когда обратный отсчет = 0)
  useEffect(() => {
    preSignals.forEach(signal => {
      if (signal.countdown === 0 && !signal.isActive) {
        toast.success(`🚀 Сигнал активен: ${signal.pair}`, {
          description: `${signal.type} • ${signal.winProbability?.toFixed(1)}% • Экспирация: ${signal.expiration}с`,
          duration: 10000,
        });
      }
    });
  }, [preSignals]);

  return {
    preSignals,
    upcomingSignals,
    activePreSignals: preSignals.filter(s => (s.countdown || 0) <= 10), // Последние 10 секунд
  };
};
