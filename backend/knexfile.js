require('dotenv').config();

module.exports = {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root', // <--- usuário padrão XAMPP/WAMP/Laragon
            password: process.env.DB_PASSWORD || "", // <--- coloque senha se houver
            database: process.env.DB_NAME || 'freelancerhub_db' // <--- mesmo nome do init.sql
        }
    }
};