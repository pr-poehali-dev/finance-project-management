import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const API_BASE = 'https://functions.poehali.dev/cdf95276-0ee2-4819-8a40-d619b8b8fb62';
const PROJECTS_API = 'https://functions.poehali.dev/631d6a6d-9657-43fe-bef1-0a38e1e85d68';
const CONTRACTORS_API = 'https://functions.poehali.dev/850a0fed-8a2e-453d-88a4-6a527ec30caa';

interface Project {
  id: number;
  title: string;
  company_name: string;
}

interface Contractor {
  id: number;
  name: string;
  specialization: string;
}

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId?: number;
}

const PaymentForm = ({ open, onOpenChange, onSuccess, projectId }: PaymentFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    project_id: projectId ? String(projectId) : '',
    contractor_id: '',
    type: 'income',
    amount: '',
    description: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (projectId) {
      setFormData((prev) => ({ ...prev, project_id: String(projectId) }));
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectsRes, contractorsRes] = await Promise.all([
        fetch(PROJECTS_API),
        fetch(CONTRACTORS_API),
      ]);

      const projectsData = await projectsRes.json();
      const contractorsData = await contractorsRes.json();

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setContractors(Array.isArray(contractorsData) ? contractorsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setProjects([]);
      setContractors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}?action=create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contractor_id: formData.contractor_id && formData.contractor_id !== 'none' ? formData.contractor_id : null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setFormData({
          project_id: projectId ? String(projectId) : '',
          contractor_id: '',
          type: 'income',
          amount: '',
          description: '',
          payment_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавление платежа</DialogTitle>
          <DialogDescription>Зарегистрируйте поступление или расход по проекту</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Тип платежа</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, contractor_id: value === 'income' ? '' : formData.contractor_id })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <Icon name="TrendingUp" size={16} className="text-green-500" />
                      Доход
                    </div>
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <Icon name="TrendingDown" size={16} className="text-red-500" />
                      Расход
                    </div>
                  </SelectItem>
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
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="completed">Выполнен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Проект</Label>
            <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.title} ({project.company_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'expense' && (
            <div className="space-y-2">
              <Label htmlFor="contractor_id">Подрядчик (опционально)</Label>
              <Select value={formData.contractor_id} onValueChange={(value) => setFormData({ ...formData, contractor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подрядчика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не указан</SelectItem>
                  {contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={String(contractor.id)}>
                      {contractor.name} ({contractor.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма (₽)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Дата платежа</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание платежа..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Создать платеж'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentForm;