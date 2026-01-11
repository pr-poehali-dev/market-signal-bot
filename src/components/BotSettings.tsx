import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
          Настройки AI-бота Pro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl">⚙️ Профессиональные настройки AI-бота</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-success/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${botSettings.isEnabled ? 'bg-success animate-pulse shadow-lg shadow-success/50' : 'bg-muted-foreground'}`}></div>
              <div>
                <Label className="text-base font-semibold">AI-бот Premium</Label>
                <p className="text-sm text-muted-foreground">
                  {botSettings.isEnabled ? '🚀 Бот активен • 10 стратегий работают' : '⏸️ Бот остановлен'}
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
              <Label className="text-base font-semibold">Удалённое подключение к Pocket Option</Label>
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
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-1">
                  <Icon name="Check" size={12} className="text-success mt-0.5" />
                  <span>Работает удалённо 24/7</span>
                </div>
                <div className="flex items-start gap-1">
                  <Icon name="Check" size={12} className="text-success mt-0.5" />
                  <span>Не требует установки</span>
                </div>
                <div className="flex items-start gap-1">
                  <Icon name="Check" size={12} className="text-success mt-0.5" />
                  <span>Облачные вычисления</span>
                </div>
                <div className="flex items-start gap-1">
                  <Icon name="Check" size={12} className="text-success mt-0.5" />
                  <span>Только ID для подключения</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <Label className="text-base">Демо счёт</Label>
                <p className="text-xs text-muted-foreground">
                  {botSettings.isDemoAccount ? 'Безопасное тестирование' : 'Реальная торговля'}
                </p>
              </div>
              <Switch
                checked={botSettings.isDemoAccount}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, isDemoAccount: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <Label className="text-base">Умный риск-менеджмент</Label>
                <p className="text-xs text-muted-foreground">
                  {botSettings.useSmartRisk ? 'Адаптивные суммы' : 'Фиксированные суммы'}
                </p>
              </div>
              <Switch
                checked={botSettings.useSmartRisk}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, useSmartRisk: checked }))}
              />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-success/20 to-primary/20 border border-success/40 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Zap" size={20} className="text-success" />
              <Label className="text-base font-semibold">⚡ Система реального времени</Label>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
              <div>
                <Label className="text-sm">Предсигналы за 1 минуту</Label>
                <p className="text-xs text-muted-foreground">Получать оповещения перед открытием</p>
              </div>
              <Switch
                checked={botSettings.preSignalEnabled}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, preSignalEnabled: checked }))}
              />
            </div>

            {botSettings.preSignalEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="preSignalMinutes">Время предупреждения (минут)</Label>
                  <span className="text-sm font-semibold text-primary">{botSettings.preSignalMinutes}</span>
                </div>
                <Slider
                  id="preSignalMinutes"
                  min={1}
                  max={5}
                  step={1}
                  value={[botSettings.preSignalMinutes]}
                  onValueChange={([value]) => setBotSettings(prev => ({ ...prev, preSignalMinutes: value }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  🎯 Оптимально: 1-2 минуты для подготовки к сделке
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
              <div>
                <Label className="text-sm">Котировки в реальном времени</Label>
                <p className="text-xs text-muted-foreground">Обновление каждую 1 секунду</p>
              </div>
              <Switch
                checked={botSettings.realTimeQuotes}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, realTimeQuotes: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
              <div>
                <Label className="text-sm">Автообновление стратегий</Label>
                <p className="text-xs text-muted-foreground">Улучшение алгоритмов в реальном времени</p>
              </div>
              <Switch
                checked={botSettings.autoUpdateStrategies}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoUpdateStrategies: checked }))}
              />
            </div>

            {botSettings.realTimeQuotes && (
              <div className="p-3 bg-success/10 border border-success/30 rounded space-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <Icon name="Check" size={12} className="text-success" />
                  <span>Обновление графиков каждую {botSettings.updateInterval / 1000} сек</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="Check" size={12} className="text-success" />
                  <span>120+ технических индикаторов в режиме реального времени</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="Check" size={12} className="text-success" />
                  <span>Автоматический анализ всех пар одновременно</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Минимальная сумма ($)</Label>
              <Input
                id="minAmount"
                type="number"
                value={botSettings.minTradeAmount}
                onChange={(e) => setBotSettings(prev => ({ ...prev, minTradeAmount: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Максимальная сумма ($)</Label>
              <Input
                id="maxAmount"
                type="number"
                value={botSettings.maxTradeAmount}
                onChange={(e) => setBotSettings(prev => ({ ...prev, maxTradeAmount: parseFloat(e.target.value) || 100 }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="minConfidence">Минимальная уверенность для входа</Label>
              <span className="text-sm font-semibold text-primary">{botSettings.minConfidence}%</span>
            </div>
            <Slider
              id="minConfidence"
              min={75}
              max={95}
              step={1}
              value={[botSettings.minConfidence]}
              onValueChange={([value]) => setBotSettings(prev => ({ ...prev, minConfidence: value }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {botSettings.minConfidence >= 90 ? '🎯 Максимальная точность, меньше сделок' : 
               botSettings.minConfidence >= 85 ? '⚖️ Баланс точности и частоты' : 
               '📈 Больше сделок, ниже точность'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTrades">Макс. одновременных позиций</Label>
              <span className="text-sm font-semibold text-primary">{botSettings.maxConcurrentTrades}</span>
            </div>
            <Slider
              id="maxTrades"
              min={1}
              max={10}
              step={1}
              value={[botSettings.maxConcurrentTrades]}
              onValueChange={([value]) => setBotSettings(prev => ({ ...prev, maxConcurrentTrades: value }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Рекомендуется: 3-5 позиций для оптимальной диверсификации
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLoss">Стоп-лосс на сессию ($)</Label>
            <Input
              id="stopLoss"
              type="number"
              value={botSettings.stopLossAmount}
              onChange={(e) => setBotSettings(prev => ({ ...prev, stopLossAmount: parseFloat(e.target.value) || 500 }))}
            />
            <p className="text-xs text-muted-foreground">🛡️ Бот автоматически остановится при достижении лимита убытка</p>
          </div>

          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={18} className="text-warning" />
              <Label className="text-base font-semibold">Расширенные настройки</Label>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
              <div>
                <Label className="text-sm">Мартингейл</Label>
                <p className="text-xs text-muted-foreground">Удвоение ставки после проигрыша</p>
              </div>
              <Switch
                checked={botSettings.martingaleEnabled}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, martingaleEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
              <div>
                <Label className="text-sm">Анти-детект защита</Label>
                <p className="text-xs text-muted-foreground">Имитация действий человека</p>
              </div>
              <Switch
                checked={botSettings.antiDetectEnabled}
                onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, antiDetectEnabled: checked }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <Label className="text-base">Автоподбор стратегии</Label>
              <p className="text-sm text-muted-foreground">AI выбирает лучшую из 10 стратегий</p>
            </div>
            <Switch
              checked={botSettings.autoStrategy}
              onCheckedChange={(checked) => setBotSettings(prev => ({ ...prev, autoStrategy: checked }))}
            />
          </div>

          <div className="space-y-3">
            <Label>Белый список IP-адресов (опционально)</Label>
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

          <div className="p-4 bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Shield" size={20} className="text-primary" />
              <Label className="text-base font-semibold">Многоуровневая защита AI-бота</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="Fingerprint" size={14} className="text-primary" />
                  Антидетект
                </p>
                <p className="text-muted-foreground">Рандомные задержки 100-500мс между действиями</p>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="Lock" size={14} className="text-primary" />
                  AES-256
                </p>
                <p className="text-muted-foreground">Военное шифрование всех запросов</p>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="RefreshCw" size={14} className="text-primary" />
                  Адаптация
                </p>
                <p className="text-muted-foreground">Обучение на каждой сделке</p>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="Network" size={14} className="text-primary" />
                  Прокси-ротация
                </p>
                <p className="text-muted-foreground">Смена IP каждые 10-15 минут</p>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="Zap" size={14} className="text-primary" />
                  Быстрый анализ
                </p>
                <p className="text-muted-foreground">Обновление каждую 1 секунду</p>
              </div>
              <div className="p-3 bg-card rounded border border-border">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Icon name="Brain" size={14} className="text-primary" />
                  Deep Learning
                </p>
                <p className="text-muted-foreground">Нейросеть анализирует паттерны</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mt-3 pt-3 border-t border-border">
              <p className="flex items-center gap-1">
                <Icon name="Check" size={12} className="text-success" />
                <span>120+ технических индикаторов в режиме реального времени</span>
              </p>
              <p className="flex items-center gap-1">
                <Icon name="Check" size={12} className="text-success" />
                <span>10 параллельных стратегий • автовыбор лучшей для каждой сделки</span>
              </p>
              <p className="flex items-center gap-1">
                <Icon name="Check" size={12} className="text-success" />
                <span>Защита от серии убытков • автопауза после 5 проигрышей</span>
              </p>
              <p className="flex items-center gap-1">
                <Icon name="Check" size={12} className="text-success" />
                <span>База знаний из 50,000+ успешных сделок профессионалов</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotSettingsDialog;