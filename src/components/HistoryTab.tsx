import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HistoryItem } from '@/types/trading';

interface HistoryTabProps {
  history: HistoryItem[];
}

export const HistoryTab = ({ history }: HistoryTabProps) => {
  return (
    <div className="mt-6">
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
    </div>
  );
};

export default HistoryTab;
