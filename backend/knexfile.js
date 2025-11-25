require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'kanban',
      password: process.env.DB_PASSWORD || 'kanbanpass',
      database: process.env.DB_NAME || 'kanban_db'
    }
  }
};
