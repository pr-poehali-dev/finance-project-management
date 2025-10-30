-- Создание таблиц для системы управления проектами

-- Таблица компаний
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица подрядчиков
CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    hourly_rate DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица оценок проектов
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    description TEXT,
    estimated_cost DECIMAL(12, 2) NOT NULL,
    estimated_hours INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица проектов
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    estimate_id INTEGER REFERENCES estimates(id),
    description TEXT,
    budget DECIMAL(12, 2) NOT NULL,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    contractor_id INTEGER REFERENCES contractors(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    description TEXT,
    payment_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_contractor ON payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_estimates_company ON estimates(company_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);