const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password required' });
        const existing = await db('users').where({ email }).first();
        if (existing) return res.status(400).json({ error: 'user already exists' });
        const hash = await bcrypt.hash(password, 10);
        const [id] = await db('users').insert({ name, email, password: hash });
        res.json({ id, name, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}

async function login(req, res) {
    try {
        console.log(" Recebendo login...");
        console.log("Body recebido:", req.body);

        const { email, password } = req.body;
        const user = await db('users').where({ email }).first();
        console.log("Resultado da busca:", user);
        if (!user) return res.status(400).json({ error: 'invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        console.log("Comparação de senha:", ok);
        if (!ok) return res.status(400).json({ error: 'invalid credentials' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        console.log("Login OK!");
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(" ERRO NO LOGIN:", err);
        res.status(500).json({ error: 'server error' });
    }
}

module.exports = { register, login };

module.exports = { register, login };