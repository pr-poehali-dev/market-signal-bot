import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { RealTimeQuote, MarketAnalysis, TradingSignal, StrategyPerformance } from '@/types/trading';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface RealTimePanelProps {
  quotes: Record<string, RealTimeQuote>;
  marketAnalysis: Record<string, MarketAnalysis>;
  strategyPerformance: StrategyPerformance[];
  preSignals: TradingSignal[];
  upcomingSignals: TradingSignal[];
  isConnected: boolean;
  lastUpdate: number;
}

export const RealTimePanel = ({
  quotes,
  marketAnalysis,
  strategyPerformance,
  preSignals,
  upcomingSignals,
  isConnected,
  lastUpdate,
}: RealTimePanelProps) => {
  const formatPrice = (price: number, pair: string) => {
    if (pair.includes('BTC')) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (pair.includes('ETH')) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (pair.includes('JPY')) return price.toFixed(2);
    return price.toFixed(4);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Статус подключения */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-success/10 border-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            <div>
              <p className="font-semibold">Реальное время • Live Market Data</p>
              <p className="text-xs text-muted-foreground">
                Обновление каждую 1 секунду • {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ru })}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            <Icon name={isConnected ? 'Wifi' : 'WifiOff'} size={14} />
            {isConnected ? 'Подключено' : 'Отключено'}
          </Badge>
        </div>
      </Card>

      {/* Предварительные сигналы за 1 минуту */}
      {preSignals.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-warning/20 to-primary/20 border-warning/40">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Bell" size={20} className="text-warning animate-bounce" />
            <h3 className="font-bold text-lg">⏰ Предсигналы (высокая вероятность)</h3>
          </div>
          <div className="space-y-3">
            {preSignals.map(signal => (
              <div
                key={signal.id}
                className="p-3 bg-card rounded-lg border-2 border-warning/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon 
                      name={signal.type === 'BUY' ? 'TrendingUp' : 'TrendingDown'} 
                      size={20} 
                      className={signal.type === 'BUY' ? 'text-success' : 'text-destructive'} 
                    />
                    <span className="font-bold text-lg">{signal.pair}</span>
                    <Badge 
                      variant={signal.type === 'BUY' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {signal.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Icon name="Target" size={16} className="text-primary" />
                      <span className="font-bold text-primary text-lg">
                        {signal.winProbability?.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{signal.strategyUsed}</p>
                  </div>
                </div>

                {/* Обратный отсчет */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">До сигнала:</span>
                    <span className="font-mono font-bold text-lg text-warning">
                      {formatCountdown(signal.countdown || signal.timeToSignal)}
                    </span>
                  </div>
                  <Progress 
                    value={((signal.timeToSignal - (signal.countdown || 0)) / signal.timeToSignal) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-secondary/50 rounded">
                    <p className="text-muted-foreground">Экспирация</p>
                    <p className="font-semibold">{signal.expiration}с</p>
                  </div>
                  <div className="text-center p-2 bg-secondary/50 rounded">
                    <p className="text-muted-foreground">Цена</p>
                    <p className="font-semibold">{formatPrice(signal.currentPrice || 0, signal.pair)}</p>
                  </div>
                  <div className="text-center p-2 bg-secondary/50 rounded">
                    <p className="text-muted-foreground">Изменение</p>
                    <p className={`font-semibold ${(signal.priceChangePercent || 0) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {signal.priceChangePercent?.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {(signal.countdown || signal.timeToSignal) <= 10 && (
                  <div className="flex items-center gap-2 p-2 bg-success/20 border border-success/40 rounded animate-pulse">
                    <Icon name="Rocket" size={16} className="text-success" />
                    <span className="text-sm font-bold text-success">Готов к открытию!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ближайшие сигналы (следующие 5 минут) */}
      {upcomingSignals.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Clock" size={18} className="text-primary" />
            <h3 className="font-semibold">📅 Ближайшие сигналы (следующие 5 минут)</h3>
          </div>
          <div className="space-y-2">
            {upcomingSignals.slice(0, 5).map(signal => (
              <div
                key={signal.id}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon 
                    name={signal.type === 'BUY' ? 'ArrowUp' : 'ArrowDown'} 
                    size={16} 
                    className={signal.type === 'BUY' ? 'text-success' : 'text-destructive'} 
                  />
                  <span className="font-semibold">{signal.pair}</span>
                  <Badge variant="outline" className="text-xs">
                    {signal.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary">
                    {signal.winProbability?.toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    через {formatCountdown(signal.countdown || signal.timeToSignal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Котировки в реальном времени */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Activity" size={18} className="text-primary" />
          <h3 className="font-semibold">📊 Котировки Live</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(quotes).map(([pair, quote]) => {
            const analysis = marketAnalysis[pair];
            return (
              <div
                key={pair}
                className="p-3 bg-secondary/30 rounded border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{pair}</span>
                  <Badge 
                    variant={quote.changePercent > 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {quote.changePercent > 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                  </Badge>
                </div>
                <div className="text-lg font-mono font-bold">
                  {formatPrice(quote.price, pair)}
                </div>
                {analysis && (
                  <div className="flex items-center gap-2 text-xs">
                    <Icon 
                      name={analysis.direction === 'BUY' ? 'TrendingUp' : 'TrendingDown'} 
                      size={14}
                      className={analysis.direction === 'BUY' ? 'text-success' : 'text-destructive'}
                    />
                    <span className="text-muted-foreground truncate">
                      {analysis.strategy.split(' ')[0]}
                    </span>
                    <span className="font-semibold text-primary ml-auto">
                      {analysis.confidence.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Производительность стратегий */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Brain" size={18} className="text-primary" />
          <h3 className="font-semibold">🧠 Производительность стратегий (обновление каждые 5с)</h3>
        </div>
        <div className="space-y-2">
          {strategyPerformance
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 5)
            .map((strategy, index) => (
              <div
                key={strategy.name}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded border border-border"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-semibold text-sm">{strategy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {strategy.totalTrades} сделок • PF: {strategy.profitFactor.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Icon name="TrendingUp" size={14} className="text-success" />
                    <span className="font-bold text-success">
                      {strategy.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${strategy.avgProfit.toFixed(1)} средняя
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Технические индикаторы */}
      {Object.keys(marketAnalysis).length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="BarChart3" size={18} className="text-primary" />
            <h3 className="font-semibold">📈 Технические индикаторы (120+ показателей)</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(marketAnalysis).slice(0, 3).map(([pair, analysis]) => (
              <div key={pair} className="space-y-2">
                <p className="font-semibold text-sm">{pair}</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-muted-foreground">RSI</p>
                    <p className={`font-semibold ${
                      analysis.indicators.rsi < 30 ? 'text-success' : 
                      analysis.indicators.rsi > 70 ? 'text-destructive' : 
                      'text-foreground'
                    }`}>
                      {analysis.indicators.rsi.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-muted-foreground">ADX</p>
                    <p className={`font-semibold ${
                      analysis.indicators.adx > 30 ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {analysis.indicators.adx.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-muted-foreground">MFI</p>
                    <p className={`font-semibold ${
                      analysis.indicators.mfi < 30 ? 'text-success' : 
                      analysis.indicators.mfi > 70 ? 'text-destructive' : 
                      'text-foreground'
                    }`}>
                      {analysis.indicators.mfi.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-muted-foreground">Stoch</p>
                    <p className={`font-semibold ${
                      analysis.indicators.stochastic < 20 ? 'text-success' : 
                      analysis.indicators.stochastic > 80 ? 'text-destructive' : 
                      'text-foreground'
                    }`}>
                      {analysis.indicators.stochastic.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RealTimePanel;
