const crypto = require('crypto');
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

// criar variável global para guartoken acess  token
let derivToken = null;

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
    // 1. Gera o code_verifier seguro com 50 caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const code_verifier = [...Array(50)].map(() => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');

    // 2. Cria o code_challenge usando o crypto (S256 obrigatório da Deriv)
    const code_challenge = crypto
        .createHash('sha256')
        .update(code_verifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // 3. Gera o state
    const state = [...Array(10)].map(() => (~~(Math.random() * 36)).toString(36)).join('');

    // 4. Salva o verifier puro no cookie do navegador
    res.cookie('deriv_verifier', code_verifier, { 
        maxAge: 600000, 
        httpOnly: true, 
        secure: true, 
        sameSite: 'lax'
    });

    // 5. Monta a URL final com o método S256 correto
    const authUrl = 'https://auth.deriv.com/oauth2/auth'
        + `?response_type=code`
        + `&client_id=${CLIENT_ID}`
        + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
        + `&scope=trade`
        + `&state=${state}`
        + `&code_challenge=${code_challenge}`
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
console.log("=== RESPOSTA COMPLETA DERIV ===");
console.log(JSON.stringify(response.data, null, 2));

      // Limpar o cookie após o sucesso para segurança
        res.clearCookie('deriv_verifier');
        
        // Captura os dados que a Deriv nos enviou de volta
        const token = response.data.access_token;
derivToken = token;
console.log("TOKEN DERIV GUARDADO");

console.log("=== TESTE CONTAS DERIV ===");

try {

    const contas = await axios.get(
        'https://api.derivws.com/trading/v1/options/accounts',
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Deriv-App-ID': CLIENT_ID
            },
            timeout: 15000
        }
    );

    console.log("=== CONTAS DERIV ===");
    console.log(JSON.stringify(contas.data, null, 2));
  const accountId = contas.data.data[0].account_id;

    const otp = await axios.post(
        `https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`,
        {},
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Deriv-App-ID': CLIENT_ID,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    console.log("=== OTP DERIV ===");
    console.log(JSON.stringify(otp.data, null, 2));

    const wsUrl = otp.data.data.url;

    return res.redirect(
        `/index.html?ws_url=${encodeURIComponent(wsUrl)}&auth=success`
    );

} catch (erroContas) {

    console.log("=== ERRO CONTAS DERIV ===");

    if (erroContas.response) {
        console.log("Status:", erroContas.response.status);
        console.log(JSON.stringify(erroContas.response.data, null, 2));
    } else {
        console.log(erroContas.message);
    }

    return res.status(500).send('Erro ao obter contas/OTP da Deriv.');
}
        
    } catch (err) {
        console.error('=== ERRO NO TOKEN ===');
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        return res.status(500).send('Erro ao finalizar a autenticação com a Deriv. Veja os logs do Render.');
    }
});

app.get('/api/novo-otp', async (req, res) => {

    if (!derivToken) {
        return res.status(401).json({
            erro: 'Nenhum token Deriv disponível.'
        });
    }

   try {
const tipoConta =
    req.query.tipo || 'REAL';

    const contas = await axios.get(
        'https://api.derivws.com/trading/v1/options/accounts',
        {
            headers: {
                'Authorization': `Bearer ${derivToken}`,
                'Deriv-App-ID': CLIENT_ID
            },
            timeout: 15000
        }
    );

const contaEscolhida =
    contas.data.data.find(conta => {

        if (
            tipoConta === 'REAL'
        ) {
            return conta.account_type === 'real';
        }

        return conta.account_type === 'demo';

    });

const accountId =
    contaEscolhida.account_id;

    const otp = await axios.post(
        `https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`,
        {},
        {
            headers: {
                'Authorization': `Bearer ${derivToken}`,
                'Deriv-App-ID': CLIENT_ID,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    const wsUrl = otp.data.data.url;

    res.json({
        success: true,
        ws_url: wsUrl
    });

} catch (erro) {

        console.log("=== ERRO NOVO OTP ===");

        if (erro.response) {
            console.log("Status:", erro.response.status);
            console.log(JSON.stringify(erro.response.data, null, 2));
        } else {
            console.log(erro.message);
        }

        res.status(500).json({
            erro: 'Falha ao gerar novo OTP.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

