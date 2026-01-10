import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { TradingSignal } from '@/types/trading';

interface SignalsTabProps {
  signals: TradingSignal[];
  filter: 'ALL' | 'CLASSIC' | 'OTC';
  setFilter: (filter: 'ALL' | 'CLASSIC' | 'OTC') => void;
}

export const SignalsTab = ({ signals, filter, setFilter }: SignalsTabProps) => {
  const filteredSignals = signals
    .filter(s => filter === 'ALL' || s.marketType === filter)
    .sort((a, b) => b.successRate - a.successRate);

  return (
    <div className="space-y-4 mt-6">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          Все рынки
        </Button>
        <Button
          variant={filter === 'CLASSIC' ? 'default' : 'outline'}
          onClick={() => setFilter('CLASSIC')}
          size="sm"
        >
          Классические
        </Button>
        <Button
          variant={filter === 'OTC' ? 'default' : 'outline'}
          onClick={() => setFilter('OTC')}
          size="sm"
        >
          OTC рынки
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSignals.map((signal) => (
          <Card
            key={signal.id}
            className={`p-5 bg-card border-2 transition-all ${
              signal.isActive 
                ? 'border-primary/50 hover:border-primary' 
                : 'border-border opacity-60'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold font-mono text-foreground">
                    {signal.pair}
                  </div>
                  <Badge variant={signal.marketType === 'OTC' ? 'secondary' : 'outline'}>
                    {signal.marketType}
                  </Badge>
                </div>
                <Badge
                  className={`text-sm font-semibold ${
                    signal.type === 'BUY'
                      ? 'bg-success text-success-foreground'
                      : 'bg-destructive text-destructive-foreground'
                  }`}
                >
                  <Icon name={signal.type === 'BUY' ? 'ArrowUp' : 'ArrowDown'} size={14} className="mr-1" />
                  {signal.type}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Шанс на успех</p>
                  <p className="text-2xl font-bold text-foreground">{signal.successRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Экспирация</p>
                  <p className="text-lg font-semibold text-foreground">{Math.floor(signal.expiration / 60)}м</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>До сигнала</span>
                  <span className={signal.timeToSignal <= 10 ? 'text-warning font-semibold' : ''}>
                    {signal.timeToSignal}s
                  </span>
                </div>
                <Progress value={(signal.timeToSignal / 60) * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">RSI</p>
                  <p className="text-sm font-semibold text-foreground font-mono">{signal.rsi.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MACD</p>
                  <p className={`text-sm font-semibold font-mono ${signal.macd >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {signal.macd}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bollinger</p>
                  <p className="text-sm font-semibold text-foreground">{signal.bollingerPosition}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SignalsTab;
