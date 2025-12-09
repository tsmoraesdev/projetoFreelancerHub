const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- Rotas ---
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks'); // <-- Corrigido!
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const timeEntryRoutes = require('./routes/timeEntries');
const invoiceRoutes = require('./routes/invoices');
const billingProfileRoutes = require('./routes/billingProfile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas privadas (dependem de token, mas o middleware está nos arquivos internos)
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/profile', billingProfileRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});