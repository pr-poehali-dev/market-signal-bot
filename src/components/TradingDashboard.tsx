import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { ActiveTrade, BotLog } from '@/types/trading';

interface TradingDashboardProps {
  activeTrades: ActiveTrade[];
  botLogs: BotLog[];
  isEnabled: boolean;
}

export const TradingDashboard = ({ activeTrades, botLogs, isEnabled }: TradingDashboardProps) => {
  return (
    <>
      {isEnabled && activeTrades.length > 0 && (
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

      {isEnabled && botLogs.length > 0 && (
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
    </>
  );
};

export default TradingDashboard;
