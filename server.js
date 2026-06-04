const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

const PORT = process.env.PORT || 5000;

// Banco de dados local na memória para armazenar os usuários da Placa do Money
const usuariosPlataforma = [];

// ==========================================
// ETAPA 1: ROTAS DE ACESSO À PLACA DO MONEY
// ==========================================

// 1. Rota para Criar Conta na sua plataforma
app.post('/api/registrar', (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
    }
    
    const existe = usuariosPlataforma.find(u => u.email === email);
    if (existe) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
    }

    usuariosPlataforma.push({ nome, email, senha });
    return res.status(201).json({ mensagem: "Conta criada na Placa do Money com sucesso!" });
});

// 2. Rota para Entrar (Login) na sua plataforma
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const usuario = usuariosPlataforma.find(u => u.email === email && u.senha === senha);
    
    if (!usuario) {
        return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    // Login feito! Autoriza o avanço para a Etapa 2 (Botões da Deriv)
    return res.json({ 
        mensagem: "Acesso concedido! Avançando para conexão...",
        usuario: { nome: usuario.nome, email: usuario.email }
    });
});

// ==========================================
// ETAPA 2: BOTÕES DA DERIV E AFILIADO
// ==========================================

// 1. Rota que entrega o seu Link de Afiliado Real para o segundo botão
app.get('/api/link-afiliado', (req, res) => {
    const link = process.env.LINK_AFILIADO_DERIV;
    res.json({ url: link });
});

// 2. Rota que prepara o endereço de Login Alternativo (Burlar Cloudflare)
app.get('/api/deriv-auth-url', (req, res) => {
    const appId = process.env.DERIV_APP_ID || '1089';
    
    // Usamos a URL interna de sucesso da própria Deriv
    const redirectUrl = 'https://oauth.deriv.com/oauth2/successful'; 
    
    // Monta o link oficial
    const url = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&l=pt&scope=read+trade+payments&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    res.json({ url: url });
});


// 3. O Callback: Para onde a Deriv joga o usuário se ele clicar em "Permitir"
app.get('/deriv-callback', (req, res) => {
    const { token1, acct1, cur1 } = req.query;

    // Se o usuário não permitiu ou deu erro, barra ele e não mostra o painel
    if (!token1) {
        return res.send(`
            <script>
                alert("Acesso negado na Deriv. Você precisa permitir para operar.");
                window.location.href = "/"; // Volta para a tela inicial
            </script>
        `);
    }

    // Se permitiu, salva os tokens reais e libera o acesso ao painel de estratégias
    res.send(`
        <h1>Conexão Real Estabelecida!</h1>
        <script>
            localStorage.setItem('deriv_token', '${token1}');
            localStorage.setItem('deriv_account', '${acct1}');
            alert("Conta ${acct1} conectada com sucesso na Placa do Money!");
            window.location.href = "/painel"; // Libera a tela dos robôs
        </script>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor da Placa do Money rodando na porta ${PORT}`);
});

