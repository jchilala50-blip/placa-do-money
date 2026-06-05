const express = require('express');
const pkceChallenge = require('pkce-challenge').default;
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser'); // CORREÇÃO AMY: Importar cookies

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // CORREÇÃO AMY: Ativar leitura de cookies

// Armazenamento local (mantido apenas para o formulário se necessário)
let usuarios = [];

const CLIENT_ID = process.env.DERIV_APP_ID || '33syUeaX60IlPmcJHrdtB';
const REDIRECT_URI = 'https://placa-do-money.onrender.com/callback';

app.use(express.static(path.join(__dirname)));

// --- ROTAS DO USUÁRIO LOCAL ---
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
    res.json({ mensagem: 'Login efetuado com sucesso!', usuario: { nome: usuario.nome } });
});

// --- ROTAS DA API QUE O SEU HTML PROCURA ---
app.get('/api/deriv-auth-url', (req, res) => {
    const challenge = pkceChallenge();
    // Geração de state robusto e seguro com mais de 8 caracteres
    const state = [...Array(10)].map(() => (~~(Math.random() * 36)).toString(36)).join('');

    // CORREÇÃO AMY: Salvar o verifier no navegador em vez da memória instável do Render
    res.cookie('deriv_verifier', challenge.code_verifier, { 
        maxAge: 600000, // 10 minutos de validade
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
    });

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
    const link = process.env.LINK_AFILIADO || 'https://deriv.com/?region=pt';
    res.json({ url: link });
});

// --- FLUXO DE AUTENTICAÇÃO DA DERIV ---
app.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error(`Erro da Deriv no callback: ${error_description}`);
        return res.status(400).send(`Erro da Deriv: ${error_description}`);
    }

    // CORREÇÃO AMY: Resgatar o verifier salvo no Cookie do navegador
    const code_verifier = req.cookies.deriv_verifier;

    console.log("=== DIAGNÓSTICO COOKIE ===");
    console.log("State recebido:", state);
    console.log("Code presente?:", code ? "Sim" : "Não");
    console.log("Verifier recuperado do Cookie?:", code_verifier ? "Sim" : "Não (Render teria apagado se fosse memória)");

    if (!code || !code_verifier) {
        return res.status(400).send(`Falha na autenticação: Código ou Verifier ausente no navegador. Certifique-se de que aceita cookies.`);
    }

    try {
        // CORREÇÃO AMY: Formato URLSearchParams (Form-urlencoded) obrigatório
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code_verifier: code_verifier
        });

        const response = await axios.post(
            'https://auth.deriv.com/oauth2/token',
            body.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
        );

        // Limpar o cookie após o sucesso para segurança
        res.clearCookie('deriv_verifier');
        
        // Resposta de sucesso sugerida pela Amy para testes
        return res.send("<h1>Autenticado com Sucesso!</h1><p>O token da Deriv foi gerado através de Cookies seguros!</p>");
        
    } catch (err) {
        console.error('=== ERRO NO TOKEN ===');
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        return res.status(500).send('Erro ao finalizar a autenticação com a Deriv. Veja os logs do Render.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

