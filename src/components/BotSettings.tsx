import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { BotSettings as BotSettingsType } from '@/types/trading';

interface BotSettingsProps {
  botSettings: BotSettingsType;
  setBotSettings: React.Dispatch<React.SetStateAction<BotSettingsType>>;
  newIP: string;
  setNewIP: React.Dispatch<React.SetStateAction<string>>;
}

export const BotSettingsDialog = ({ botSettings, setBotSettings, newIP, setNewIP }: BotSettingsProps) => {
  return (
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
  );
};

export default BotSettingsDialog;
