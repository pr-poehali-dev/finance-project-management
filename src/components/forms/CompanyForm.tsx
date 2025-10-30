import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const API_BASE = 'https://functions.poehali.dev/3dbe8ad4-c10b-4750-bf0f-aa6da4085348';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CompanyForm = ({ open, onOpenChange, onSuccess }: CompanyFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    actual_address: '',
    bank_name: '',
    bik: '',
    correspondent_account: '',
    account_number: '',
    contact_person: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}?action=create-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setFormData({
          name: '',
          inn: '',
          kpp: '',
          ogrn: '',
          legal_address: '',
          actual_address: '',
          bank_name: '',
          bik: '',
          correspondent_account: '',
          account_number: '',
          contact_person: '',
          phone: '',
          email: '',
        });
      }
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Building2" size={20} />
            Новая организация
          </DialogTitle>
          <DialogDescription>
            Добавьте реквизиты организации-клиента
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название организации *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ООО «Рога и Копыта»"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН *</Label>
              <Input
                id="inn"
                value={formData.inn}
                onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                placeholder="1234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpp">КПП</Label>
              <Input
                id="kpp"
                value={formData.kpp}
                onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogrn">ОГРН</Label>
            <Input
              id="ogrn"
              value={formData.ogrn}
              onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })}
              placeholder="1234567890123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_address">Юридический адрес</Label>
            <Textarea
              id="legal_address"
              value={formData.legal_address}
              onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
              placeholder="г. Москва, ул. Ленина, д. 1"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual_address">Фактический адрес</Label>
            <Textarea
              id="actual_address"
              value={formData.actual_address}
              onChange={(e) => setFormData({ ...formData, actual_address: e.target.value })}
              placeholder="г. Москва, ул. Ленина, д. 1"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Банковские реквизиты</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">Название банка</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="ПАО Сбербанк"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bik">БИК</Label>
              <Input
                id="bik"
                value={formData.bik}
                onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                placeholder="044525225"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correspondent_account">Корр. счет</Label>
              <Input
                id="correspondent_account"
                value={formData.correspondent_account}
                onChange={(e) => setFormData({ ...formData, correspondent_account: e.target.value })}
                placeholder="30101810400000000225"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number">Расчетный счет</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="40702810000000000000"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Контактная информация</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Контактное лицо</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 900 123-45-67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.ru"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать организацию'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;
