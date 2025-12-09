const db = require('../db');

// Lê o perfil de faturamento do usuário logado
async function getProfile(req, res) {
    try {
        const profile = await db('billing_profile')
            .where({ user_id: req.user.id })
            .first();

        // Se não houver perfil, retorna um objeto vazio ou null (depende da preferência do frontend)
        if (!profile) {
            return res.json({});
        }

        res.json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar perfil de faturamento.' });
    }
}

// Cria ou Atualiza (UPSERT) o perfil de faturamento
async function saveOrUpdate(req, res) {
    try {
        const {
            hourly_rate,
            cpf_cnpj,
            address,
            cep,
            city,
            state,
            phone,
            bank_name,
            agency,
            account,
            account_type
        } = req.body;

        const user_id = req.user.id;

        // Verifica se o registro já existe
        const existingProfile = await db('billing_profile').where({ user_id }).first();

        const dataToSave = {
            hourly_rate: hourly_rate || 0.00, // Garante que a taxa horária tem um valor
            cpf_cnpj,
            address,
            cep,
            city,
            state,
            phone,
            bank_name,
            agency,
            account,
            account_type
            // 'user_id' só é necessário no INSERT
        };

        if (existingProfile) {
            // Se existir, atualiza (UPDATE)
            await db('billing_profile')
                .where({ user_id })
                .update(dataToSave);
        } else {
            // Se não existir, insere (INSERT)
            await db('billing_profile').insert({...dataToSave, user_id });
        }

        const updatedProfile = await db('billing_profile').where({ user_id }).first();
        res.json(updatedProfile);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar perfil de faturamento.' });
    }
}

module.exports = { getProfile, saveOrUpdate };