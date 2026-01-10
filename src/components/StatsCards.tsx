import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface StatsCardsProps {
  totalTrades: number;
  winRate: number;
  totalProfit: string;
}

export const StatsCards = ({ totalTrades, winRate, totalProfit }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Всего сделок</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalTrades}</p>
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
            <p className="text-3xl font-bold text-success mt-1">{winRate}%</p>
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
            <p className={`text-3xl font-bold mt-1 ${parseFloat(totalProfit) >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${totalProfit}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${parseFloat(totalProfit) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <Icon name="DollarSign" size={24} className={parseFloat(totalProfit) >= 0 ? 'text-success' : 'text-destructive'} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StatsCards;
