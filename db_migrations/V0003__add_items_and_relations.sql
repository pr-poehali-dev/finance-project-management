-- Services and Products table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('service', 'product')),
    unit VARCHAR(50) NOT NULL,
    default_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project items (services/products in projects)
CREATE TABLE project_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    item_id INTEGER REFERENCES items(id),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estimate items (services/products in estimates)
CREATE TABLE estimate_items (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES estimates(id),
    item_id INTEGER REFERENCES items(id),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project contractors (many-to-many with specialization)
CREATE TABLE project_contractors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    contractor_id INTEGER REFERENCES contractors(id),
    role VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10, 2),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, contractor_id, role)
);

-- Insert sample items
INSERT INTO items (name, description, type, unit, default_price) VALUES
('Дизайн лендинга', 'Разработка дизайна посадочной страницы', 'service', 'шт', 50000),
('Верстка сайта', 'Адаптивная верстка HTML/CSS', 'service', 'страница', 15000),
('Backend API', 'Разработка REST API', 'service', 'час', 3500),
('Хостинг', 'Облачный хостинг', 'product', 'месяц', 5000),
('SSL сертификат', 'Сертификат безопасности', 'product', 'год', 3000),
('Настройка сервера', 'Установка и настройка', 'service', 'шт', 25000);

-- Insert sample project items
INSERT INTO project_items (project_id, item_id, quantity, unit_price) VALUES
(1, 1, 1, 50000),
(1, 2, 5, 15000),
(1, 4, 12, 5000),
(2, 1, 1, 60000),
(2, 2, 10, 15000),
(3, 3, 100, 3500);

-- Insert sample estimate items
INSERT INTO estimate_items (estimate_id, item_id, quantity, unit_price) VALUES
(1, 1, 1, 50000),
(1, 2, 3, 15000),
(2, 3, 200, 3500);

-- Insert sample project contractors
INSERT INTO project_contractors (project_id, contractor_id, role, hourly_rate) VALUES
(1, 1, 'Дизайн', 2500),
(1, 2, 'Верстка', 3000),
(2, 1, 'Дизайн', 2500),
(2, 2, 'Верстка', 3000),
(2, 3, 'Программирование', 3500),
(3, 3, 'Программирование', 3500),
(3, 4, 'ПО', 4000);