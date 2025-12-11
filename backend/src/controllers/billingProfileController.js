const db = require('../db');

// Lê o perfil de faturamento do usuário logado
const getProfile = async(req, res) => {
    // Obtém o ID do usuário do middleware de autenticação
    const userId = req.user.id;

    try {
        // CORREÇÃO: Usando a sintaxe Knex/SQL consistente com saveOrUpdate
        const dbProfile = await db('billing_profile')
            .where({ user_id: userId })
            .first();

        if (!dbProfile) {
            // Retorna 200 OK com null se não houver dados, para que o frontend use o estado inicial
            return res.status(200).json(null);
        }

        // Mapeamento dos campos do banco (snake_case) para o frontend (camelCase)
        const frontendProfile = {
            nomeRazao: dbProfile.nome_razao, // Mapeado: nome_razao -> nomeRazao
            cpfCnpj: dbProfile.cpf_cnpj, // Mapeado: cpf_cnpj -> cpfCnpj
            endereco: dbProfile.address, // Mapeado: address -> endereco
            cep: dbProfile.cep,
            cidade: dbProfile.city, // Mapeado: city -> cidade
            estado: dbProfile.state, // Mapeado: state -> estado
            telefone: dbProfile.phone, // Mapeado: phone -> telefone
            // O campo email não está no perfil de faturamento, mas se estivesse, deveria ser mapeado aqui.
            nomeBanco: dbProfile.bank_name, // Mapeado: bank_name -> nomeBanco
            agencia: dbProfile.agency,
            conta: dbProfile.account,
            tipoConta: dbProfile.account_type // Mapeado: account_type -> tipoConta
        };

        // 4. Retorna os dados mapeados
        res.status(200).json(frontendProfile);

    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar perfil." });
    }
};

// Cria ou Atualiza (UPSERT) o perfil de faturamento
async function saveOrUpdate(req, res) {
    try {
        // CORREÇÃO: Destructuring com os nomes de campos do Perfil.jsx (camelCase)
        const {
            nomeRazao,
            cpfCnpj,
            endereco,
            cep,
            cidade,
            estado,
            telefone,
            nomeBanco,
            agencia,
            conta,
            tipoConta
        } = req.body;

        const user_id = req.user.id;

        // Verifica se o registro já existe
        const existingProfile = await db('billing_profile').where({ user_id }).first();

        // Mapeamento dos campos do frontend (camelCase) para o banco de dados (snake_case)
        const dataToSave = {
            nome_razao: nomeRazao,
            cpf_cnpj: cpfCnpj,
            address: endereco,
            cep: cep,
            city: cidade,
            state: estado,
            phone: telefone,
            bank_name: nomeBanco,
            agency: agencia,
            account: conta,
            account_type: tipoConta,
            // 'hourly_rate' removido por não estar no frontend, ou pode ser adicionado se for necessário (ex: hourly_rate: req.body.hourly_rate || 0.00)
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

        // Retorna o perfil atualizado (pode ser útil se o banco gerar IDs, etc.)
        const updatedProfile = await db('billing_profile').where({ user_id }).first();

        // Opcional: Mapear o retorno de volta para camelCase para consistência do frontend
        const returnedProfile = {
            ...updatedProfile, // O resto dos dados do banco
            nomeRazao: updatedProfile.nome_razao,
            cpfCnpj: updatedProfile.cpf_cnpj,
            endereco: updatedProfile.address,
            cidade: updatedProfile.city,
            estado: updatedProfile.state,
            telefone: updatedProfile.phone,
            nomeBanco: updatedProfile.bank_name,
            tipoConta: updatedProfile.account_type,
            // ... Mapear todos os outros campos se necessário
        };

        res.json(returnedProfile);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar perfil de faturamento.' });
    }
}

module.exports = { getProfile, saveOrUpdate };