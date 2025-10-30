import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import ProjectForm from '@/components/forms/ProjectForm';
import EstimateForm from '@/components/forms/EstimateForm';
import PaymentForm from '@/components/forms/PaymentForm';
import ItemForm from '@/components/forms/ItemForm';

const FUNCTIONS = {
  stats: 'https://functions.poehali.dev/b27021b6-5f87-44ed-9fde-234aaf974da4',
  projects: 'https://functions.poehali.dev/631d6a6d-9657-43fe-bef1-0a38e1e85d68',
  estimates: 'https://functions.poehali.dev/8dc3fcd1-7649-49e4-a36e-2bffbcc4b25d',
  contractors: 'https://functions.poehali.dev/850a0fed-8a2e-453d-88a4-6a527ec30caa',
};

interface DashboardStats {
  projects: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_budget: string;
    total_spent: string;
    total_profit: string;
  };
  contractors: {
    total_contractors: number;
  };
  estimates: {
    total_estimates: number;
    draft_estimates: number;
    approved_estimates: number;
    total_estimated: string;
  };
  payments: {
    total_payments: string;
    payment_count: number;
    pending_payments: number;
  };
}

interface Project {
  id: number;
  title: string;
  description: string;
  budget: string;
  actual_cost: string;
  profit: string;
  status: string;
  company_name: string;
  payment_count: number;
}

interface Estimate {
  id: number;
  title: string;
  description: string;
  estimated_cost: string;
  estimated_hours: number;
  status: string;
  company_name: string;
  converted_to_project: boolean;
}

interface Contractor {
  id: number;
  name: string;
  specialization: string;
  email: string;
  hourly_rate: string;
  total_projects: number;
  total_earned: string;
  pending_payments: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes, estimatesRes, contractorsRes] = await Promise.all([
          fetch(FUNCTIONS.stats),
          fetch(FUNCTIONS.projects),
          fetch(FUNCTIONS.estimates),
          fetch(FUNCTIONS.contractors),
        ]);

        const statsData = await statsRes.json();
        const projectsData = await projectsRes.json();
        const estimatesData = await estimatesRes.json();
        const contractorsData = await contractorsRes.json();

        setStats(statsData);
        setProjects(projectsData);
        setEstimates(estimatesData);
        setContractors(contractorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleFormSuccess = () => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes, estimatesRes, contractorsRes] = await Promise.all([
          fetch(FUNCTIONS.stats),
          fetch(FUNCTIONS.projects),
          fetch(FUNCTIONS.estimates),
          fetch(FUNCTIONS.contractors),
        ]);

        const statsData = await statsRes.json();
        const projectsData = await projectsRes.json();
        const estimatesData = await estimatesRes.json();
        const contractorsData = await contractorsRes.json();

        setStats(statsData);
        setProjects(projectsData);
        setEstimates(estimatesData);
        setContractors(contractorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      in_progress: { label: 'В работе', variant: 'default' },
      completed: { label: 'Завершен', variant: 'secondary' },
      planning: { label: 'Планирование', variant: 'outline' },
      draft: { label: 'Черновик', variant: 'outline' },
      approved: { label: 'Утверждена', variant: 'secondary' },
      in_review: { label: 'На проверке', variant: 'default' },
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка данных...</div>
      </div>
    );
  }

  const profitChartData = projects.slice(0, 5).map((p) => ({
    name: p.title.substring(0, 20),
    budget: Number(p.budget),
    spent: Number(p.actual_cost),
    profit: Number(p.profit),
  }));

  return (
    <div className="min-h-screen bg-background dark">
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="LayoutDashboard" className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ProjectHub</h1>
              <p className="text-xs text-muted-foreground">Управление проектами и финансами</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Icon name="Settings" size={16} className="mr-2" />
              Настройки
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <Icon name="LayoutDashboard" size={16} />
              <span className="hidden sm:inline">Дашборд</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Icon name="FolderKanban" size={16} />
              <span className="hidden sm:inline">Проекты</span>
            </TabsTrigger>
            <TabsTrigger value="estimates" className="gap-2">
              <Icon name="FileText" size={16} />
              <span className="hidden sm:inline">Оценки</span>
            </TabsTrigger>
            <TabsTrigger value="contractors" className="gap-2">
              <Icon name="Users" size={16} />
              <span className="hidden sm:inline">Подрядчики</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="TrendingUp" size={16} />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего проектов</CardTitle>
                  <Icon name="FolderKanban" className="text-primary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.projects.total_projects || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Активных: {stats?.projects.active_projects || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общий бюджет</CardTitle>
                  <Icon name="Wallet" className="text-secondary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(stats?.projects.total_budget || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Потрачено: {formatCurrency(stats?.projects.total_spent || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
                  <Icon name="TrendingUp" className="text-accent" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {formatCurrency(stats?.projects.total_profit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.projects.completed_projects || 0} завершено
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Подрядчики</CardTitle>
                  <Icon name="Users" className="text-primary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.contractors.total_contractors || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ожидают оплату: {stats?.payments.pending_payments || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Финансы по проектам</CardTitle>
                  <CardDescription>Бюджет, расходы и прибыль</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      budget: { label: 'Бюджет', color: 'hsl(var(--primary))' },
                      spent: { label: 'Потрачено', color: 'hsl(var(--secondary))' },
                      profit: { label: 'Прибыль', color: 'hsl(var(--accent))' },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="spent" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статистика оценок</CardTitle>
                  <CardDescription>Оценки проектов и их статусы</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Всего оценок</span>
                      <span className="font-bold">{stats?.estimates.total_estimates || 0}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Утверждено</span>
                      <span className="font-bold text-accent">
                        {stats?.estimates.approved_estimates || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((stats?.estimates.approved_estimates || 0) /
                          (stats?.estimates.total_estimates || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">В черновиках</span>
                      <span className="font-bold">{stats?.estimates.draft_estimates || 0}</span>
                    </div>
                    <Progress
                      value={
                        ((stats?.estimates.draft_estimates || 0) / (stats?.estimates.total_estimates || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Общая сумма оценок</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(stats?.estimates.total_estimated || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Проекты</h2>
                <p className="text-muted-foreground">Управление всеми проектами</p>
              </div>
              <Button onClick={() => setProjectFormOpen(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Новый проект
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.company_name}</CardDescription>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Бюджет</span>
                        <span className="font-semibold">{formatCurrency(project.budget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Потрачено</span>
                        <span>{formatCurrency(project.actual_cost)}</span>
                      </div>
                      <Progress
                        value={(Number(project.actual_cost) / Number(project.budget)) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Прибыль: </span>
                          <span className="font-bold text-accent">{formatCurrency(project.profit)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon name="CreditCard" size={14} />
                          {project.payment_count}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setPaymentFormOpen(true)}
                      >
                        <Icon name="Plus" size={14} className="mr-2" />
                        Добавить платеж
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estimates" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Оценки проектов</h2>
                <p className="text-muted-foreground">Предварительные оценки и расчеты</p>
              </div>
              <Button onClick={() => setEstimateFormOpen(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Новая оценка
              </Button>
            </div>

            <div className="grid gap-4">
              {estimates.map((estimate) => (
                <Card key={estimate.id} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{estimate.title}</CardTitle>
                          {estimate.converted_to_project && (
                            <Badge variant="secondary" className="gap-1">
                              <Icon name="CheckCircle2" size={12} />
                              Конвертирована
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">{estimate.company_name}</CardDescription>
                      </div>
                      {getStatusBadge(estimate.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Стоимость</div>
                        <div className="text-lg font-bold">{formatCurrency(estimate.estimated_cost)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Часов</div>
                        <div className="text-lg font-bold">{estimate.estimated_hours}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Час/ставка</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(Number(estimate.estimated_cost) / estimate.estimated_hours)}
                        </div>
                      </div>
                    </div>
                    {!estimate.converted_to_project && (
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Icon name="ArrowRight" size={14} className="mr-2" />
                        Конвертировать в проект
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Подрядчики</h2>
                <p className="text-muted-foreground">База подрядчиков и специалистов</p>
              </div>
              <Button onClick={() => setItemFormOpen(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить услугу/товар
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {contractors.map((contractor) => (
                <Card key={contractor.id} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {contractor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle>{contractor.name}</CardTitle>
                          <CardDescription>{contractor.specialization}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{formatCurrency(contractor.hourly_rate)}/час</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium truncate">{contractor.email}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Проектов</div>
                        <div className="font-medium">{contractor.total_projects}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Всего заработал</div>
                          <div className="text-xl font-bold text-accent">
                            {formatCurrency(contractor.total_earned)}
                          </div>
                        </div>
                        {contractor.pending_payments > 0 && (
                          <Badge variant="destructive">
                            <Icon name="Clock" size={12} className="mr-1" />
                            {contractor.pending_payments} ожидает
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold">Аналитика</h2>
              <p className="text-muted-foreground">Детальная финансовая аналитика</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Всего платежей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.payments.payment_count || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    На сумму {formatCurrency(stats?.payments.total_payments || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Средняя прибыль</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {formatCurrency(
                      Number(stats?.projects.total_profit || 0) / (stats?.projects.total_projects || 1)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">На проект</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">
                    {(
                      (Number(stats?.projects.total_profit || 0) /
                        Number(stats?.projects.total_spent || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Рентабельность инвестиций</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Топ проектов по прибыли</CardTitle>
                <CardDescription>Самые прибыльные проекты</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects
                    .sort((a, b) => Number(b.profit) - Number(a.profit))
                    .slice(0, 5)
                    .map((project, index) => (
                      <div key={project.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground">{project.company_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-accent">{formatCurrency(project.profit)}</div>
                          <div className="text-xs text-muted-foreground">
                            {((Number(project.profit) / Number(project.budget)) * 100).toFixed(0)}% ROI
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <ProjectForm 
        open={projectFormOpen} 
        onOpenChange={setProjectFormOpen} 
        onSuccess={handleFormSuccess} 
      />
      <EstimateForm 
        open={estimateFormOpen} 
        onOpenChange={setEstimateFormOpen} 
        onSuccess={handleFormSuccess} 
      />
      <PaymentForm 
        open={paymentFormOpen} 
        onOpenChange={setPaymentFormOpen} 
        onSuccess={handleFormSuccess} 
      />
      <ItemForm 
        open={itemFormOpen} 
        onOpenChange={setItemFormOpen} 
        onSuccess={handleFormSuccess} 
      />
    </div>
  );
};

export default Index;