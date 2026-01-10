import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HistoryItem } from '@/types/trading';

interface ChartsTabProps {
  chartData: any[];
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  history: HistoryItem[];
}

export const ChartsTab = ({ chartData, selectedPair, setSelectedPair, history }: ChartsTabProps) => {
  const profitByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourTrades = history.filter(h => {
      const tradeHour = parseInt(h.timestamp.split(':')[0]);
      return tradeHour === hour;
    });
    return {
      hour: `${hour}:00`,
      profit: hourTrades.reduce((sum, h) => sum + h.profit, 0),
      trades: hourTrades.length
    };
  }).filter(h => h.trades > 0);

  return (
    <div className="mt-6 space-y-4">
      {profitByHour.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">📊 Почасовая доходность</h3>
            <p className="text-sm text-muted-foreground">Прибыль по часам торговли</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={profitByHour}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Прибыль']}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Select value={selectedPair} onValueChange={setSelectedPair}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR/USD">EUR/USD</SelectItem>
            <SelectItem value="GBP/USD">GBP/USD</SelectItem>
            <SelectItem value="USD/JPY">USD/JPY</SelectItem>
            <SelectItem value="BTC/USD">BTC/USD</SelectItem>
            <SelectItem value="ETH/USD">ETH/USD</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="font-mono text-lg">
          {chartData[chartData.length - 1]?.price || '0.00000'}
        </Badge>
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">График цены</h3>
          <p className="text-sm text-muted-foreground">Движение цены в реальном времени</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} domain={['dataMin - 0.001', 'dataMax + 0.001']} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">RSI Индикатор</h3>
            <p className="text-sm text-muted-foreground">Relative Strength Index</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Перекупленность', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ value: 'Перепроданность', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Line type="monotone" dataKey="rsi" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">MACD Индикатор</h3>
            <p className="text-sm text-muted-foreground">Moving Average Convergence Divergence</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default ChartsTab;
