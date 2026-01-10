import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradingSignal {
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
}

interface HistoryItem {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  result: 'WIN' | 'LOSS';
  profit: number;
  timestamp: string;
}

const generateMockSignals = (): TradingSignal[] => {
  const pairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
    'EUR/GBP', 'BTC/USD', 'ETH/USD', 'XAU/USD', 'OIL/USD'
  ];
  
  return pairs.map((pair, index) => ({
    id: `signal-${index}`,
    pair,
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    marketType: index % 3 === 0 ? 'OTC' : 'CLASSIC',
    successRate: Math.floor(65 + Math.random() * 30),
    expiration: [15, 30, 60, 120, 180][Math.floor(Math.random() * 5)],
    timeToSignal: Math.floor(30 + Math.random() * 30),
    rsi: Math.floor(30 + Math.random() * 40),
    macd: parseFloat((Math.random() * 2 - 1).toFixed(2)),
    bollingerPosition: ['UPPER', 'MIDDLE', 'LOWER'][Math.floor(Math.random() * 3)] as any,
    isActive: Math.random() > 0.3
  }));
};

const generateMockHistory = (): HistoryItem[] => {
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

const generateChartData = (pair: string) => {
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

const Index = () => {
  const [signals, setSignals] = useState<TradingSignal[]>(generateMockSignals());
  const [history, setHistory] = useState<HistoryItem[]>(generateMockHistory());
  const [filter, setFilter] = useState<'ALL' | 'CLASSIC' | 'OTC'>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [chartData, setChartData] = useState(generateChartData('EUR/USD'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSignals(prev => prev.map(signal => ({
        ...signal,
        timeToSignal: Math.max(0, signal.timeToSignal - 1),
        rsi: Math.max(0, Math.min(100, signal.rsi + (Math.random() - 0.5) * 2))
      })));
      
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastPrice = prev[prev.length - 1].price;
        const newPrice = parseFloat((lastPrice + (Math.random() - 0.5) * 0.002).toFixed(5));
        newData.push({
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          rsi: Math.floor(30 + Math.random() * 40),
          macd: parseFloat((Math.random() * 2 - 1).toFixed(3)),
          volume: Math.floor(1000 + Math.random() * 5000)
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setChartData(generateChartData(selectedPair));
  }, [selectedPair]);

  const filteredSignals = signals
    .filter(s => filter === 'ALL' || s.marketType === filter)
    .sort((a, b) => b.successRate - a.successRate);

  const stats = {
    totalTrades: history.length,
    winRate: Math.round((history.filter(h => h.result === 'WIN').length / history.length) * 100),
    totalProfit: history.reduce((sum, h) => sum + h.profit, 0).toFixed(2)
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="TrendingUp" size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pocket Option Bot</h1>
              <p className="text-sm text-muted-foreground">Анализ рынков в реальном времени</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Текущее время</p>
            <p className="text-lg font-mono font-semibold text-foreground">
              {currentTime.toLocaleTimeString('ru-RU')}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего сделок</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalTrades}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="BarChart3" size={24} className="text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Процент побед</p>
                <p className="text-3xl font-bold text-success mt-1">{stats.winRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Icon name="Trophy" size={24} className="text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Общая прибыль</p>
                <p className={`text-3xl font-bold mt-1 ${parseFloat(stats.totalProfit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.totalProfit}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${parseFloat(stats.totalProfit) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Icon name="DollarSign" size={24} className={parseFloat(stats.totalProfit) >= 0 ? 'text-success' : 'text-destructive'} />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="signals" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="signals">Сигналы</TabsTrigger>
            <TabsTrigger value="charts">Графики</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="space-y-4 mt-6">
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
                    signal.timeToSignal <= 10 && signal.isActive
                      ? signal.type === 'BUY'
                        ? 'border-success pulse-success'
                        : 'border-destructive pulse-danger'
                      : 'border-border'
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
                        <p className="text-lg font-semibold text-foreground">{signal.expiration}s</p>
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
          </TabsContent>

          <TabsContent value="charts" className="mt-6 space-y-4">
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
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="p-6 bg-card border-border">
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={item.type === 'BUY' ? 'default' : 'destructive'}
                        className="w-16"
                      >
                        {item.type}
                      </Badge>
                      <div>
                        <p className="font-semibold text-foreground font-mono">{item.pair}</p>
                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={item.result === 'WIN' ? 'default' : 'destructive'}
                        className={item.result === 'WIN' ? 'bg-success' : ''}
                      >
                        {item.result}
                      </Badge>
                      <p
                        className={`text-lg font-bold font-mono ${
                          item.profit >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {item.profit >= 0 ? '+' : ''}${item.profit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;