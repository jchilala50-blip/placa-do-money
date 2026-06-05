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
    const state = Math.random().toString(36).substring(2); // TROQUEI PARA 2! PULA O '0.'

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
    const { code, state, error, error_description } = req.query;

    console.log("=== DIAGNÓSTICO AMY ===");
    console.log("State recebido:", state);
    console.log("Code presente?:", code ? "Sim" : "Não");
    console.log("Memória temporária atual:", JSON.stringify(temporaryStorage));

    if (error) {
        console.error(`Erro reportado pela Deriv: ${error} - ${error_description}`);
        return res.status(400).send(`Erro da Deriv: ${error_description}`);
    }

    const code_verifier = temporaryStorage[state];

    if (!code || !code_verifier) {
        console.error(`Falha: Faltou code ou verifier. state=${state}`);
        return res.status(400).send(`Faltou code ou verifier. state=${state}. Se o state veio correto, o Render apagou a memória.`);
    }

    try {
        // Correção 1 da Amy: Usar URLSearchParams para formatar os dados corretamente
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code_verifier: code_verifier
        });

        console.log("A enviar POST para a Deriv...");
        const response = await axios.post(
            'https://auth.deriv.com/oauth2/token',
            body.toString(),
            { 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
                timeout: 15000 
            }
        );

        delete temporaryStorage[state];
        
        // Resposta simples sugerida pela Amy para testar o sucesso
        return res.send("<h1>Autenticado com Sucesso!</h1><p>O token da Deriv foi gerado e o fluxo funciona!</p>");
        
    } catch (err) {
        // Correção 3 da Amy: Logs detalhados em caso de erro na troca de token
        console.error('=== ERRO CRÍTICO NA TROCA DE TOKEN ===');
        console.error('Status:', err.response?.status);
        console.error('Headers:', err.response?.headers);
        console.error('Data:', err.response?.data);
        console.error('Mensagem original:', err.message);
        console.error('======================================');
        
        return res.status(500).send('Erro ao finalizar a autenticação com a Deriv. Verifique os logs do Render.');
    }
});

