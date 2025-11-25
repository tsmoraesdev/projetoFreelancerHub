# Kanban - Projeto (React + Node + MySQL + Docker)

## Requisitos
- Docker & Docker Compose

## Rodar local com Docker
1. Copie `backend/.env.example` para `backend/.env` (se desejar altere)
2. `docker-compose up --build`
3. Frontend em http://localhost:3000 (Vite com proxy)
4. Backend em http://localhost:4000

## Observações
- O banco é inicializado pelo script em `db/init.sql`.
- Para produção ajuste secrets e volumes.
