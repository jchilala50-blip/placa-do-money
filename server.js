const express = require('express');
const pkceChallenge = require('pkce-challenge').default;
const axios = require('axios'); // Garanta que o axios está instalado ou use o 'fetch' nativo do Node 18+
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Armazenamento temporário em memória para o code_verifier (em produção idealmente seria uma sessão/cookie seguro)
let temporaryStorage = {};

const CLIENT_ID = process.env.DERIV_APP_ID || '33spfQyss60bkoXo0e00o';
const REDIRECT_URI = 'https://placa-do-money.onrender.com/callback';

app.use(express.static(path.join(__dirname)));

// 1. Rota de Login - Inicia o fluxo PKCE
app.get('/login', (req, res) => {
    // Gera o par de chaves PKCE
    const challenge = pkceChallenge();
    
    // Identificador simples para rastrear a requisição (pode ser melhorado com sessões)
    const state = Math.random().toString(36).substring(7);
    
    // Salva o verifier para checar no callback
    temporaryStorage[state] = challenge.code_verifier;

    const authUrl = `https://oauth.deriv.com/oauth2/authorize` +
                    `?app_id=${CLIENT_ID}` +
                    `&code_challenge=${challenge.code_challenge}` +
                    `&code_challenge_method=S256` +
                    `&state=${state}`;

    res.redirect(authUrl);
});

// 2. Rota de Callback - Onde a Deriv devolve o usuário com o 'code'
app.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const code_verifier = temporaryStorage[state];

    if (!code || !code_verifier) {
        return res.status(400).send('Falha na autenticação: Código ou Verifier ausente.');
    }

    try {
        // Troca o código pelo Token de Acesso definitivo
        const response = await axios.post('https://oauth.deriv.com/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code_verifier: code_verifier
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Limpa o armazenamento temporário
        delete temporaryStorage[state];

        // Aqui você recebe os dados de acesso (tokens, contas, etc)
        const tokenData = response.data;
        
        // Redireciona de volta para a página principal passando as informações (ou salve em cookies/localStorage)
        res.redirect(`/?auth_success=true&tokens=${JSON.stringify(tokenData)}`);

    } catch (error) {
        console.error('Erro ao trocar token:', error.response?.data || error.message);
        res.status(500).send('Erro ao finalizar a autenticação com a Deriv.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});

