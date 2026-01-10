import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradingSignal, BotSettings, HistoryItem, BotLog, ActiveTrade, MarketAnalysis } from '@/types/trading';
import { advancedMarketAnalysis, generateMockSignals, generateMockHistory, generateChartData, generateNewSignal } from '@/utils/trading';
import BotSettingsDialog from '@/components/BotSettings';
import TradingDashboard from '@/components/TradingDashboard';

const Index = () => {
  const [signals, setSignals] = useState<TradingSignal[]>(generateMockSignals());
  const [history, setHistory] = useState<HistoryItem[]>(generateMockHistory());
  const [filter, setFilter] = useState<'ALL' | 'CLASSIC' | 'OTC'>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [chartData, setChartData] = useState(generateChartData('EUR/USD'));
  const [botSettings, setBotSettings] = useState<BotSettings>({
    isEnabled: false,
    accountId: '',
    isDemoAccount: true,
    minTradeAmount: 1,
    maxTradeAmount: 100,
    stopLossAmount: 500,
    allowedIPs: [],
    autoStrategy: true,
    currentStrategy: 'Aggressive Scalping'
  });
  const [newIP, setNewIP] = useState('');
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [nextTradeCheck, setNextTradeCheck] = useState(0);

  const addBotLog = (action: BotLog['action'], data?: Partial<BotLog>) => {
    const newLog: BotLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      action,
      ...data
    };
    setBotLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      setActiveTrades(prev => prev.map(trade => {
        const newTimeLeft = Math.max(0, trade.timeLeft - 1);
        
        if (newTimeLeft === 0 && trade.timeLeft > 0) {
          const currentPrice = chartData[chartData.length - 1]?.price || trade.openPrice;
          const priceChange = currentPrice - trade.openPrice;
          const isWin = (trade.type === 'BUY' && priceChange > 0) || (trade.type === 'SELL' && priceChange < 0);
          const profit = isWin ? trade.amount * 0.8 : -trade.amount;
          
          const newHistoryItem: HistoryItem = {
            id: `history-${Date.now()}-${trade.id}`,
            pair: trade.pair,
            type: trade.type,
            result: isWin ? 'WIN' : 'LOSS',
            profit: parseFloat(profit.toFixed(2)),
            timestamp: new Date().toLocaleTimeString('ru-RU')
          };
          
          setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
          addBotLog('TRADE_CLOSED', { 
            pair: trade.pair, 
            type: trade.type, 
            amount: trade.amount,
            reason: `${isWin ? 'WIN' : 'LOSS'} ${profit > 0 ? '+' : ''}$${profit.toFixed(2)}` 
          });
          
          return { ...trade, timeLeft: 0 };
        }
        
        return { ...trade, timeLeft: newTimeLeft };
      }).filter(trade => trade.timeLeft > 0));
      
      if (botSettings.isEnabled && botSettings.accountId) {
        const allAnalyses = signals.map(signal => {
          try {
            return advancedMarketAnalysis(chartData, signal.pair);
          } catch {
            return null;
          }
        }).filter(a => a !== null) as MarketAnalysis[];
        
        const bestAnalysis = allAnalyses
          .filter(a => a.confidence >= 82)
          .sort((a, b) => b.confidence - a.confidence)[0];
        
        setNextTradeCheck(prev => {
          const newValue = prev - 1;
          
          if (newValue <= 0) {
            if (bestAnalysis && activeTrades.length < 3) {
              const currentPrice = chartData[chartData.length - 1]?.price || 1.1;
              const tradeAmount = Math.floor(
                Math.random() * (botSettings.maxTradeAmount - botSettings.minTradeAmount) + botSettings.minTradeAmount
              );
              
              const newTrade: ActiveTrade = {
                id: `trade-${Date.now()}`,
                pair: bestAnalysis.pair,
                type: bestAnalysis.direction,
                amount: tradeAmount,
                openPrice: currentPrice,
                expiration: [60, 120, 180, 300][Math.floor(Math.random() * 4)],
                timeLeft: [60, 120, 180, 300][Math.floor(Math.random() * 4)],
                successRate: bestAnalysis.confidence,
                strategy: bestAnalysis.strategy
              };
              
              setActiveTrades(prev => [...prev, newTrade]);
              addBotLog('TRADE_OPENED', {
                pair: bestAnalysis.pair,
                type: bestAnalysis.direction,
                amount: tradeAmount,
                reason: `${bestAnalysis.strategy} • ${bestAnalysis.confidence}% • RSI:${bestAnalysis.indicators.rsi} MACD:${bestAnalysis.indicators.macd} ADX:${bestAnalysis.indicators.adx} CCI:${bestAnalysis.indicators.cci}`
              });
            } else if (activeTrades.length === 0) {
              const topAnalysis = allAnalyses.sort((a, b) => b.confidence - a.confidence)[0];
              addBotLog('ANALYZING', { 
                reason: `Анализирую ${allAnalyses.length} пар • Лучший: ${topAnalysis?.pair || 'N/A'} (${topAnalysis?.confidence || 0}%) • Стратегия: ${topAnalysis?.strategy || 'N/A'} • Ожидаю >82%` 
              });
            }
            
            return 1;
          }
          
          return newValue;
        });
      }
      
      setSignals(prev => prev.map(signal => {
        const newTimeToSignal = Math.max(0, signal.timeToSignal - 1);
        
        if (newTimeToSignal === 0 && signal.timeToSignal === 1) {
          return generateNewSignal(signal, chartData);
        }
        
        return {
          ...signal,
          timeToSignal: newTimeToSignal,
          rsi: Math.max(0, Math.min(100, signal.rsi + (Math.random() - 0.5) * 2))
        };
      }));
      
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastPrice = prev[prev.length - 1].price;
        const volatility = (Math.random() - 0.5) * 0.003;
        const newPrice = parseFloat((lastPrice + volatility).toFixed(5));
        
        const prices = prev.slice(-14).map(d => d.price).concat(newPrice);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const gains = [];
        const losses = [];
        for (let i = 1; i < prices.length; i++) {
          const change = prices[i] - prices[i - 1];
          if (change > 0) gains.push(change);
          else losses.push(Math.abs(change));
        }
        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = Math.floor(100 - (100 / (1 + rs)));
        
        const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
        const ema26 = prices.slice(-26) ? prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, prices.length) : avgPrice;
        const macd = parseFloat((ema12 - ema26).toFixed(3));
        
        newData.push({
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          rsi: Math.max(0, Math.min(100, rsi)),
          macd: macd,
          volume: Math.floor(1000 + Math.random() * 5000)
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [chartData, botSettings, signals, activeTrades]);

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

        <div className="flex items-center justify-between">
          <BotSettingsDialog 
            botSettings={botSettings}
            setBotSettings={setBotSettings}
            newIP={newIP}
            setNewIP={setNewIP}
          />

          {botSettings.isEnabled && (
            <Badge variant="default" className="gap-2 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              AI-бот активен • {botSettings.currentStrategy}
            </Badge>
          )}
        </div>

        <TradingDashboard 
          activeTrades={activeTrades}
          botLogs={botLogs}
          isEnabled={botSettings.isEnabled}
        />

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
          </TabsContent>

          <TabsContent value="charts" className="mt-6 space-y-4">
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
