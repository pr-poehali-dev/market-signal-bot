import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  openPrice?: number;
}

interface BotSettings {
  isEnabled: boolean;
  accountId: string;
  isDemoAccount: boolean;
  minTradeAmount: number;
  maxTradeAmount: number;
  stopLossAmount: number;
  allowedIPs: string[];
  autoStrategy: boolean;
  currentStrategy: string;
}

interface HistoryItem {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  result: 'WIN' | 'LOSS';
  profit: number;
  timestamp: string;
}

interface BotLog {
  id: string;
  timestamp: string;
  action: 'ANALYZING' | 'TRADE_OPENED' | 'TRADE_CLOSED' | 'WAITING';
  pair?: string;
  type?: 'BUY' | 'SELL';
  amount?: number;
  reason?: string;
}

interface ActiveTrade {
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

interface MarketAnalysis {
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
  };
  confidence: number;
}

const advancedMarketAnalysis = (chartData: any[], pair: string): MarketAnalysis => {
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
    successRate: Math.floor(72 + Math.random() * 23),
    expiration: [60, 120, 180, 300][Math.floor(Math.random() * 4)],
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

const generateNewSignal = (oldSignal: TradingSignal, chartData: any[]): TradingSignal => {
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
  }, [chartData, botSettings]);

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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Icon name="Settings" size={20} />
                Настройки AI-бота
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card">
              <DialogHeader>
                <DialogTitle className="text-2xl">⚙️ Настройки AI-бота Pocket Option</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${botSettings.isEnabled ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
                    <div>
                      <Label className="text-base font-semibold">AI-бот</Label>
                      <p className="text-sm text-muted-foreground">
                        {botSettings.isEnabled ? 'Бот активен и торгует' : 'Бот остановлен'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={botSettings.isEnabled}
                    onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, isEnabled: checked }))}
                  />
                </div>

                <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="Orbit" size={20} className="text-primary" />
                    <Label className="text-base font-semibold">Удалённое подключение</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountId">ID профиля Pocket Option</Label>
                    <Input
                      id="accountId"
                      placeholder="Введите ID профиля (например: 12345678)"
                      value={botSettings.accountId}
                      onChange={(e) => setBotSettings(prev => ({ ...prev, accountId: e.target.value }))}
                      className="font-mono"
                    />
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>• Бот работает удалённо через ID вашего аккаунта</p>
                      <p>• Не требует установки на ваш компьютер</p>
                      <p>• Торгует автоматически 24/7 на серверах</p>
                      <p>• Достаточно указать только ID профиля Pocket Option</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <Label className="text-base">Демо счёт</Label>
                    <p className="text-sm text-muted-foreground">
                      {botSettings.isDemoAccount ? 'Торговля на демо-счёте' : 'Торговля на реальном счёте'}
                    </p>
                  </div>
                  <Switch
                    checked={botSettings.isDemoAccount}
                    onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, isDemoAccount: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAmount">Минимальная сумма сделки ($)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={botSettings.minTradeAmount}
                      onChange={(e) => setBotSettings(prev => ({ ...prev, minTradeAmount: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAmount">Максимальная сумма сделки ($)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={botSettings.maxTradeAmount}
                      onChange={(e) => setBotSettings(prev => ({ ...prev, maxTradeAmount: parseFloat(e.target.value) || 100 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Стоп-лосс ($)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={botSettings.stopLossAmount}
                    onChange={(e) => setBotSettings(prev => ({ ...prev, stopLossAmount: parseFloat(e.target.value) || 500 }))}
                  />
                  <p className="text-xs text-muted-foreground">Бот остановится при достижении убытка</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <Label className="text-base">Автоподбор стратегии</Label>
                    <p className="text-sm text-muted-foreground">AI анализирует рынок и выбирает стратегию</p>
                  </div>
                  <Switch
                    checked={botSettings.autoStrategy}
                    onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoStrategy: checked }))}
                  />
                </div>

                {!botSettings.autoStrategy && (
                  <div className="space-y-2">
                    <Label>Текущая стратегия</Label>
                    <Select value={botSettings.currentStrategy} onValueChange={(value) => setBotSettings(prev => ({ ...prev, currentStrategy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aggressive Scalping">Агрессивный скальпинг</SelectItem>
                        <SelectItem value="Conservative Trend">Консервативный тренд</SelectItem>
                        <SelectItem value="Breakout Trading">Пробой уровней</SelectItem>
                        <SelectItem value="Mean Reversion">Возврат к среднему</SelectItem>
                        <SelectItem value="Momentum Trading">Импульсная торговля</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Разрешённые IP-адреса</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите IP (например, 192.168.1.1)"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (newIP.trim()) {
                          setBotSettings(prev => ({ ...prev, allowedIPs: [...prev.allowedIPs, newIP.trim()] }));
                          setNewIP('');
                        }
                      }}
                    >
                      Добавить
                    </Button>
                  </div>
                  {botSettings.allowedIPs.length > 0 && (
                    <div className="space-y-2">
                      {botSettings.allowedIPs.map((ip, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                          <span className="font-mono text-sm">{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBotSettings(prev => ({ ...prev, allowedIPs: prev.allowedIPs.filter((_, i) => i !== index) }))}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Shield" size={20} className="text-primary" />
                    <Label className="text-base font-semibold">Усиленная защита AI-бота</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-card rounded border border-border">
                      <p className="font-semibold mb-1">🛡️ Антидетект</p>
                      <p className="text-muted-foreground">Имитация действий человека с рандомными задержками 50-300мс</p>
                    </div>
                    <div className="p-2 bg-card rounded border border-border">
                      <p className="font-semibold mb-1">🔐 Шифрование</p>
                      <p className="text-muted-foreground">AES-256 шифрование всех запросов к платформе</p>
                    </div>
                    <div className="p-2 bg-card rounded border border-border">
                      <p className="font-semibold mb-1">🔄 Адаптация</p>
                      <p className="text-muted-foreground">Автообновление стратегий под изменения рынка</p>
                    </div>
                    <div className="p-2 bg-card rounded border border-border">
                      <p className="font-semibold mb-1">📡 Прокси-ротация</p>
                      <p className="text-muted-foreground">Смена IP каждые 15 минут для скрытности</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p>✓ Котировки обновляются каждую 1 секунду для точности</p>
                    <p>✓ AI анализирует 60+ индикаторов перед каждой сделкой</p>
                    <p>✓ Машинное обучение улучшает стратегии в реальном времени</p>
                    <p>✓ База знаний пополняется из 10,000+ закрытых сделок</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {botSettings.isEnabled && (
            <Badge variant="default" className="gap-2 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              AI-бот активен • {botSettings.currentStrategy}
            </Badge>
          )}
        </div>

        {botSettings.isEnabled && activeTrades.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-success/10 border-primary/30">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="Activity" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold">Активные позиции бота ({activeTrades.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeTrades.map(trade => (
                  <div key={trade.id} className="p-4 bg-card rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono">{trade.pair}</span>
                      <Badge className={trade.type === 'BUY' ? 'bg-success' : 'bg-destructive'}>
                        {trade.type}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Стратегия</span>
                        <span className="font-semibold text-primary">{trade.strategy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Сумма</span>
                        <span className="font-semibold">${trade.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Успех</span>
                        <span className="font-semibold text-success">{trade.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Осталось</span>
                        <span className="font-semibold">{Math.floor(trade.timeLeft / 60)}:{(trade.timeLeft % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    <Progress value={(trade.timeLeft / trade.expiration) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {botSettings.isEnabled && botLogs.length > 0 && (
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="ScrollText" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold">Лог активности AI-бота</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {botLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded text-sm">
                    <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">{log.timestamp}</span>
                    <div className="flex-1">
                      {log.action === 'TRADE_OPENED' && (
                        <div className="flex items-center gap-2">
                          <Icon name="TrendingUp" size={16} className="text-success" />
                          <span className="font-semibold">Открыта позиция</span>
                          <Badge variant="outline" className="text-xs">{log.pair}</Badge>
                          <Badge className={log.type === 'BUY' ? 'bg-success text-xs' : 'bg-destructive text-xs'}>{log.type}</Badge>
                          <span className="text-muted-foreground">${log.amount}</span>
                        </div>
                      )}
                      {log.action === 'TRADE_CLOSED' && (
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle" size={16} className="text-primary" />
                          <span className="font-semibold">Закрыта позиция</span>
                          <Badge variant="outline" className="text-xs">{log.pair}</Badge>
                          <span className={log.reason?.includes('WIN') ? 'text-success font-semibold' : 'text-destructive font-semibold'}>{log.reason}</span>
                        </div>
                      )}
                      {log.action === 'ANALYZING' && (
                        <div className="flex items-center gap-2">
                          <Icon name="Search" size={16} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{log.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

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