import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = 'https://functions.poehali.dev/cdf95276-0ee2-4819-8a40-d619b8b8fb62';

interface Company {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;
  type: string;
  unit: string;
  default_price: string;
}

interface EstimateItem {
  item_id: number;
  quantity: number;
  unit_price: number;
}

interface EstimateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EstimateForm = ({ open, onOpenChange, onSuccess }: EstimateFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    status: 'draft',
    estimated_hours: '',
  });

  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [companiesRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE}?action=companies`),
        fetch(`${API_BASE}?action=items`),
      ]);

      const companiesData = await companiesRes.json();
      const itemsData = await itemsRes.json();

      setCompanies(companiesData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addItem = () => {
    if (items.length > 0) {
      setEstimateItems([
        ...estimateItems,
        { item_id: items[0].id, quantity: 1, unit_price: Number(items[0].default_price) },
      ]);
    }
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: number) => {
    const updated = [...estimateItems];
    updated[index] = { ...updated[index], [field]: value };
    setEstimateItems(updated);
  };

  const removeItem = (index: number) => {
    setEstimateItems(estimateItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}?action=create-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: estimateItems,
        }),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setFormData({
          company_id: '',
          title: '',
          description: '',
          status: 'draft',
          estimated_hours: '',
        });
        setEstimateItems([]);
      }
    } catch (error) {
      console.error('Error creating estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = estimateItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание оценки проекта</DialogTitle>
          <DialogDescription>Создайте предварительную оценку стоимости проекта</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Компания</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите компанию" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="in_review">На проверке</SelectItem>
                  <SelectItem value="approved">Утверждена</SelectItem>
                  <SelectItem value="rejected">Отклонена</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название оценки</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Разработка корпоративного сайта"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Подробное описание работ..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_hours">Оценочное время (часов)</Label>
            <Input
              id="estimated_hours"
              type="number"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              placeholder="0"
              step="0.1"
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Услуги и товары</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {estimateItems.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Услуга/Товар</Label>
                    <Select
                      value={String(item.item_id)}
                      onValueChange={(value) => {
                        const selectedItem = items.find((i) => i.id === Number(value));
                        if (selectedItem) {
                          updateItem(index, 'item_id', Number(value));
                          updateItem(index, 'unit_price', Number(selectedItem.default_price));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-24 space-y-2">
                    <Label>Кол-во</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Цена</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      min="0"
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Сумма</Label>
                    <Input value={(item.quantity * item.unit_price).toFixed(2)} disabled />
                  </div>

                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              ))}

              {estimateItems.length > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <div className="space-y-1 text-right">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Общая стоимость: </span>
                      <span className="text-lg font-bold">{totalCost.toFixed(2)} ₽</span>
                    </div>
                    {formData.estimated_hours && Number(formData.estimated_hours) > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Ставка в час: {(totalCost / Number(formData.estimated_hours)).toFixed(2)} ₽
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать оценку'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EstimateForm;