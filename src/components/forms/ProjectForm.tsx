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
const CONTRACTORS_API = 'https://functions.poehali.dev/850a0fed-8a2e-453d-88a4-6a527ec30caa';

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

interface Contractor {
  id: number;
  name: string;
  specialization: string;
  hourly_rate: string;
}

interface ProjectItem {
  item_id: number;
  quantity: number;
  unit_price: number;
}

interface ProjectContractor {
  contractor_id: number;
  role: string;
  hourly_rate: number;
}

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ProjectForm = ({ open, onOpenChange, onSuccess }: ProjectFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    budget: '',
    status: 'planning',
    start_date: '',
  });

  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectContractors, setProjectContractors] = useState<ProjectContractor[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [companiesRes, itemsRes, contractorsRes] = await Promise.all([
        fetch(`${API_BASE}?action=companies`),
        fetch(`${API_BASE}?action=items`),
        fetch(CONTRACTORS_API),
      ]);

      const companiesData = await companiesRes.json();
      const itemsData = await itemsRes.json();
      const contractorsData = await contractorsRes.json();

      setCompanies(companiesData);
      setItems(itemsData);
      setContractors(contractorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addItem = () => {
    if (items.length > 0) {
      setProjectItems([
        ...projectItems,
        { item_id: items[0].id, quantity: 1, unit_price: Number(items[0].default_price) },
      ]);
    }
  };

  const updateItem = (index: number, field: keyof ProjectItem, value: number) => {
    const updated = [...projectItems];
    updated[index] = { ...updated[index], [field]: value };
    setProjectItems(updated);
  };

  const removeItem = (index: number) => {
    setProjectItems(projectItems.filter((_, i) => i !== index));
  };

  const addContractor = () => {
    if (contractors.length > 0) {
      const contractor = contractors[0];
      const roleMap: Record<string, string> = {
        design: 'Дизайн',
        frontend: 'Верстка',
        backend: 'Программирование',
        software: 'ПО',
      };
      setProjectContractors([
        ...projectContractors,
        { contractor_id: contractor.id, role: roleMap[contractor.specialization] || 'Дизайн', hourly_rate: Number(contractor.hourly_rate) },
      ]);
    }
  };

  const updateContractor = (index: number, field: keyof ProjectContractor, value: number | string) => {
    const updated = [...projectContractors];
    updated[index] = { ...updated[index], [field]: value };
    setProjectContractors(updated);
  };

  const removeContractor = (index: number) => {
    setProjectContractors(projectContractors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}?action=create-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: projectItems,
          contractors: projectContractors,
        }),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setFormData({
          company_id: '',
          title: '',
          description: '',
          budget: '',
          status: 'planning',
          start_date: '',
        });
        setProjectItems([]);
        setProjectContractors([]);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = projectItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание проекта</DialogTitle>
          <DialogDescription>Заполните информацию о новом проекте</DialogDescription>
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
                  <SelectItem value="planning">Планирование</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="completed">Завершен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название проекта</Label>
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
              placeholder="Подробное описание проекта..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Бюджет (₽)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Дата начала</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
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
              {projectItems.map((item, index) => (
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

              {projectItems.length > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Итого: </span>
                    <span className="text-lg font-bold">{totalItems.toFixed(2)} ₽</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Подрядчики</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addContractor}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectContractors.map((pc, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Подрядчик</Label>
                    <Select
                      value={String(pc.contractor_id)}
                      onValueChange={(value) => {
                        const contractor = contractors.find((c) => c.id === Number(value));
                        if (contractor) {
                          updateContractor(index, 'contractor_id', Number(value));
                          updateContractor(index, 'hourly_rate', Number(contractor.hourly_rate));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contractors.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} ({c.specialization})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-40 space-y-2">
                    <Label>Роль</Label>
                    <Select value={pc.role} onValueChange={(value) => updateContractor(index, 'role', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Дизайн">Дизайн</SelectItem>
                        <SelectItem value="Верстка">Верстка</SelectItem>
                        <SelectItem value="Программирование">Программирование</SelectItem>
                        <SelectItem value="ПО">ПО</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Ставка/час</Label>
                    <Input
                      type="number"
                      value={pc.hourly_rate}
                      onChange={(e) => updateContractor(index, 'hourly_rate', Number(e.target.value))}
                      min="0"
                    />
                  </div>

                  <Button type="button" variant="ghost" size="icon" onClick={() => removeContractor(index)}>
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать проект'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;