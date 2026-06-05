const express = require('express');
const pkceChallenge = require('pkce-challenge').default;
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que o servidor entenda dados enviados via JSON (essencial para a linha 312 do seu HTML)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Armazenamento temporário (Substitua por um Banco de Dados real depois)
let usuarios = []; 
let temporaryStorage = {};

const CLIENT_ID = process.env.DERIV_APP_ID || '33syUeaX60IlPmcJHrdtB';
const REDIRECT_URI = 'https://placa-do-money.onrender.com/callback';

app.use(express.static(path.join(__dirname)));

// --- ROTAS DO USUÁRIO LOCAL (Conserta o erro físico do seu formulário) ---

app.post('/registrar', (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos!' });
    }
    usuarios.push({ nome, email, senha });
    res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (!usuario) {
        return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
    }
    res.json({ mensagem: 'Login efetuado com sucesso!', usuario: { nome: usuario.nome, email: usuario.email } });
});


// --- ROTAS DA API QUE O SEU HTML PROCURA ---

app.get('/api/deriv-auth-url', (req, res) => {
    const challenge = pkceChallenge();
    const state = Math.random().toString(36).substring(1); // Mudei de 7 para 1!
    temporaryStorage[state] = challenge.code_verifier;

        const authUrl = 'https://auth.deriv.com/oauth2/auth'
            + `?response_type=code`
            + `&client_id=${CLIENT_ID}`
            + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
            + `&scope=trade`
            + `&state=${state}`
            + `&code_challenge=${challenge.code_challenge}`
            + `&code_challenge_method=S256`;


    res.json({ url: authUrl });
});


app.get('/api/link-afiliado', (req, res) => {
    // Retorna o link de afiliado configurado no .env ou um padrão
    const link = process.env.LINK_AFILIADO || 'https://deriv.com/?region=pt';
    res.json({ url: link });
});


// --- FLUXO DE AUTENTICAÇÃO DA DERIV ---

app.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const code_verifier = temporaryStorage[state];

    if (!code || !code_verifier) {
        return res.status(400).send('Falha na autenticação: Código ou Verifier ausente.');
    }

    try {
        const response = await axios.post('https://oauth.deriv.com/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code_verifier: code_verifier
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        delete temporaryStorage[state];
                res.redirect(`https://placa-do-money.onrender.com/?auth_success=true&tokens=${JSON.stringify(response.data)}`);

    } catch (error) {
        console.error('Erro ao trocar token:', error.response?.data || error.message);
        res.status(500).send('Erro ao finalizar a autenticação com a Deriv.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
