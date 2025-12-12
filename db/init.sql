
CREATE DATABASE IF NOT EXISTS freelancerhub_db;
USE freelancerhub_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS billing_profile (
  user_id INT PRIMARY KEY,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cpf_cnpj VARCHAR(18) NULL, 
  address VARCHAR(255) NULL,
  cep VARCHAR(10) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(50) NULL,
  phone VARCHAR(20) NULL,
  bank_name VARCHAR(100) NULL,
  agency VARCHAR(20) NULL,
  account VARCHAR(50) NULL,
  account_type ENUM('Corrente', 'Poupanca') DEFAULT 'Corrente',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, 
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  client_id INT NOT NULL, 
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  start_date DATE NULL,
  due_date DATE NULL,
  billing_type ENUM('hourly', 'fixed') NOT NULL DEFAULT 'hourly',
  fixed_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'active', 'completed', 'canceled') DEFAULT 'active',
  invoice_id INT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT 
);


CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL, 
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  due_date DATE NULL,
  status ENUM('todo', 'doing', 'done') DEFAULT 'todo', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL, 
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  duration_seconds INT NULL,
  notes TEXT NULL,
  is_billed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, 
  client_id INT NOT NULL, 
  invoice_number VARCHAR(50) NOT NULL UNIQUE, 
  issue_date DATE NOT NULL,
  due_date DATE NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'paid', 'canceled') DEFAULT 'pending', 
  pdf_path VARCHAR(255) NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);