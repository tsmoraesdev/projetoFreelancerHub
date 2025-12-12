
## Descrição Geral
O FreelancerHub é uma plataforma completa criada para auxiliar freelancers no gerenciamento dos seus trabalhos e relacionamentos com clientes.

A aplicação oferece módulos de:
-Gestão de clientes
-Gestão de projetos

Sistema de Kanban

Cronômetro integrado para registro de horas trabalhadas
-Módulo de faturamento
-Dashboard de produtividade

O sistema é dividido em dois módulos independentes:
-Backend → API REST em Node.js
-Frontend → Interface em React + Vite


## Requisitos
- Docker & Docker Compose
- jSPDF
- QRCode


## Rodar local com Docker
1. Copie `backend/.env.example` para `backend/.env` (se desejar altere)
2. `docker-compose up --build`
3. Frontend em http://localhost:3000 (Vite com proxy)
4. Backend em http://localhost:4000

## Observações
- O banco é inicializado pelo script em `db/init.sql`.
- Para produção ajuste secrets e volumes.


## Funcionalidades do Sistema
Clientes
-Criar, editar e excluir clientes
-Associar clientes aos projetos

Projetos
-Cadastro completo de projetos
-Prazos, descrição e status
-Vinculação com clientes

Kanban
-Três colunas: Pendente, Em andamento, Concluído
-Arrastar e alterar status
-Atualização em tempo real

Cronômetro
-Iniciar/parar tempo de trabalho por projeto
-Envio automático para módulo de faturamento

Faturamento
-Registros gerados pelo cronômetro
-Histórico de pagamentos
-Total mensal e anual

Autenticação
-Login com JWT
-Proteção de rotas no backend
-Persistência de sessão no frontend

## Tecnologias Utilizadas
Backend
-Node.js
-Express
-Knex.js
-MySQL
-JWT Authentication
-Middleware customizados
-Docker

Frontend
-React
-Vite
-React Router DOM
-Axios
-TailwindCSS
-Hooks e componentização


## Comando para clonar repositório
git clone https://github.com/tsmoraesdev/projetoFreelancerHub.git

## Configuração do Banco de Dados
1. Inicie seu MySQL
2. Execute o arquivo:

freelancer_bd/db/init.sql

## Rodando o Backend
cd backend
npm install
npm run dev

## Rodando o Frontend
cd frontend
npm install
npm run dev
