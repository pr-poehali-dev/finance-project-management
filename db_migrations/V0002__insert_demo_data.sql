-- Вставка тестовых данных для демонстрации

-- Компании
INSERT INTO companies (name, description, contact_email) VALUES
('ТехноСтрой', 'Строительная компания', 'info@tehnostroy.ru'),
('ДизайнПро', 'Дизайн-студия', 'hello@designpro.ru'),
('IT Solutions', 'ИТ компания', 'contact@itsolutions.ru');

-- Подрядчики
INSERT INTO contractors (name, specialization, email, hourly_rate) VALUES
('Иванов Алексей', 'Frontend разработчик', 'ivanov@example.com', 2500),
('Петрова Мария', 'UX/UI дизайнер', 'petrova@example.com', 2000),
('Сидоров Дмитрий', 'Backend разработчик', 'sidorov@example.com', 3000),
('Козлова Анна', 'Project Manager', 'kozlova@example.com', 2200);

-- Оценки
INSERT INTO estimates (title, company_id, description, estimated_cost, estimated_hours, status) VALUES
('Корпоративный сайт', 1, 'Разработка корпоративного сайта с CMS', 450000, 180, 'approved'),
('Мобильное приложение', 2, 'iOS и Android приложение для доставки', 850000, 340, 'draft'),
('CRM система', 3, 'Внутренняя CRM для управления клиентами', 1200000, 480, 'in_review');

-- Проекты
INSERT INTO projects (title, company_id, estimate_id, description, budget, actual_cost, status, start_date) VALUES
('Корпоративный сайт ТехноСтрой', 1, 1, 'Полный редизайн и разработка', 450000, 320000, 'in_progress', '2025-01-15'),
('E-commerce платформа', 3, NULL, 'Интернет-магазин с интеграциями', 680000, 680000, 'completed', '2024-09-01'),
('Брендинг и айдентика', 2, NULL, 'Разработка фирменного стиля', 280000, 150000, 'in_progress', '2025-02-01');

-- Платежи
INSERT INTO payments (project_id, contractor_id, amount, payment_type, description, payment_date, status) VALUES
(1, 1, 120000, 'milestone', 'Оплата за первый этап разработки', '2025-02-01', 'completed'),
(1, 2, 80000, 'milestone', 'Дизайн макеты', '2025-01-20', 'completed'),
(1, 3, 120000, 'milestone', 'Backend разработка', '2025-02-15', 'completed'),
(2, 1, 200000, 'final', 'Финальная оплата', '2024-12-15', 'completed'),
(2, 3, 280000, 'milestone', 'Разработка платформы', '2024-11-01', 'completed'),
(2, 4, 200000, 'milestone', 'Управление проектом', '2024-12-01', 'completed'),
(3, 2, 150000, 'milestone', 'Брендбук и гайдлайны', '2025-02-20', 'pending');