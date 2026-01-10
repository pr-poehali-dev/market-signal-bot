import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { TradingSignal, BotSettings, HistoryItem, BotLog, ActiveTrade, MarketAnalysis } from '@/types/trading';
import { advancedMarketAnalysis, generateMockSignals, generateMockHistory, generateChartData, generateNewSignal } from '@/utils/trading';
import BotSettingsDialog from '@/components/BotSettings';
import TradingDashboard from '@/components/TradingDashboard';
import StatsCards from '@/components/StatsCards';
import SignalsTab from '@/components/SignalsTab';
import ChartsTab from '@/components/ChartsTab';
import HistoryTab from '@/components/HistoryTab';

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

        <StatsCards 
          totalTrades={stats.totalTrades}
          winRate={stats.winRate}
          totalProfit={stats.totalProfit}
        />

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

          <TabsContent value="signals">
            <SignalsTab 
              signals={signals}
              filter={filter}
              setFilter={setFilter}
            />
          </TabsContent>

          <TabsContent value="charts">
            <ChartsTab 
              chartData={chartData}
              selectedPair={selectedPair}
              setSelectedPair={setSelectedPair}
              history={history}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab history={history} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
