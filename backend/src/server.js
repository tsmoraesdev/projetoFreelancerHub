require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);

app.get('/', (req, res) => res.json({ ok: true, service: 'kanban-backend' }));

app.listen(port, () => console.log(`Server running on port ${port}`));
