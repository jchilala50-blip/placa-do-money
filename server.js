const crypto = require('crypto');
const express = require('express');
const pkceChallenge = require('pkce-challenge').default;
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser'); // CORREÇÃO AMY: Importar cookies
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // CORREÇÃO AMY: Ativar leitura de cookies

app.use(session({
    secret: 'placa-do-money-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));


const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
.then(() => {
    console.log("✅ Ligado à base de dados Supabase.");
})
.catch(err => {
    console.error("❌ Erro ao ligar à base de dados:", err);
});

// criar variável global para guartoken acess  token
// let derivToken = null;

const CLIENT_ID = process.env.DERIV_APP_ID || '33syUeaX60IlPmcJHrdtB';
const REDIRECT_URI = 'https://placa-do-money.onrender.com/callback';

app.use(express.static(path.join(__dirname)));

// --- ROTAS DO USUÁRIO LOCAL ---

app.post('/registrar', async (req, res) => {
    
const { nome, email, senha } = req.body;

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!regexEmail.test(email)) {
    return res.status(400).json({
        erro: "Digite um e-mail válido."
    });
}

if (senha.length < 6) {
    return res.status(400).json({
        erro: "A senha deve ter pelo menos 6 caracteres."
    });
}

if (nome.trim().length < 3) {
    return res.status(400).json({
        erro: "O nome deve ter pelo menos 3 letras."
    });
}

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos!' });
    }

    try {

        const existe = await db.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({
                erro: "Este e-mail já está registado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        await db.query(
    "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)",
    [nome, email, senhaHash]
    );

        res.status(201).json({
            mensagem: "Usuário registrado com sucesso!"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao guardar utilizador."
        });
    }
});

// -- ROTA DE LOGIN---

app.post('/login', async (req, res) => {

    const { email, senha } = req.body;

    try {

        const resultado = await db.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(400).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const usuario = resultado.rows[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(400).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        req.session.usuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email
};
        res.json({
            mensagem: "Login efetuado com sucesso!",
            usuario: {
                nome: usuario.nome
            }
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao efetuar login."
        });

    }

});

// ---NOVA ROTA PARA MANTER SESSÃO PERSITENTE---

app.get('/sessao', (req, res) => {

    if (req.session.usuario) {
        return res.json({
            autenticado: true,
            usuario: req.session.usuario
        });
    }

    res.json({
        autenticado: false
    });

});

// ---ROTA GARANTE QUE A SESSAO SEJA BEM TERMINADA 

app.post('/logout', (req, res) => {

    req.session.destroy(() => {
        res.json({
            mensagem: "Sessão terminada."
        });
    });

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

const link = process.env.LINK_AFILIADO || 'https://partner-tracking.deriv.com/click?a=14293&o=1&c=3&link_id=1';

res.json({ url: link });

});


// --- FLUXO DE AUTENTICAÇÃO DA DERIV ---

const codigosUsados = new Set();


app.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error(`Erro da Deriv no callback: ${error_description}`);
        return res.status(400).send(`Erro da Deriv: ${error_description}`);
    }

    // NOVO FILTRO: Se o código já foi usado nos últimos minutos, ignora e vai para a dashboard
    if (code && codigosUsados.has(code)) {
        console.log(`[OAuth] Código ${code} já processado anteriormente. Redirecionando utilizador.`);
        return res.redirect('/index.html');
    }

    // Registar o código atual como "usado"
    if (code) {
        codigosUsados.add(code);
        // Limpa da memória após 5 minutos para não acumular lixo
        setTimeout(() => codigosUsados.delete(code), 300000);
    }





    // CORREÇÃO AMY: Resgatar o verifier salvo no Cookie do navegador
    const code_verifier = req.cookies.deriv_verifier;

    console.log("=== DIAGNÓSTICO COOKIE ===");
    console.log("State recebido:", state);
    console.log("Code presente?:", code ? "Sim" : "Não");
    console.log("Verifier recuperado do Cookie?:", code_verifier ? "Sim" : "Não (Render teria apagado se fosse memória)");

    if (!code || !code_verifier) {
    console.log("Detectada tentativa de reutilização de sessão ou histórico. Redirecionando para login limpo.");
    return res.redirect('/index.html');
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
req.session.derivToken = token;

if (req.session.usuario) {

    await db.query(
        "UPDATE usuarios SET deriv_token = $1 WHERE id = $2",
        [
            token,
            req.session.usuario.id
        ]
    );

    console.log("TOKEN DERIV GUARDADO NA SUPABASE");

}

console.log("TOKEN DERIV GUARDADO");

try {

    const perfil = await axios.get(
        'https://api.deriv.com/user/profile',
        {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 15000
        }
    );

    console.log("=== PERFIL DERIV ===");
    console.log(JSON.stringify(perfil.data, null, 2));

} catch (erro) {

    console.log("=== ERRO PERFIL ===");

    if (erro.response) {
        console.log(JSON.stringify(erro.response.data, null, 2));
    } else {
        console.log(erro.message);
    }

}

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

console.log("=== TOKEN USADO ===");
console.log(token);

    console.log("=== CONTAS DERIV ===");
    console.log(JSON.stringify(contas.data, null, 2));

console.log("=== TIPOS DE CONTA ===");

contas.data.data.forEach(conta => {

    console.log(
        "ID:",
        conta.account_id,
        "| TYPE:",
        conta.account_type
    );

});

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

    if (!req.session.usuario) {
    return res.status(401).json({
        erro: 'Utilizador não autenticado.'
    });
}

const resultado = await db.query(
    "SELECT deriv_token FROM usuarios WHERE id = $1",
    [req.session.usuario.id]
);

if (resultado.rows.length === 0 || !resultado.rows[0].deriv_token) {
    return res.status(401).json({
        erro: 'Nenhum token Deriv disponível.'
    });
}

const derivToken = resultado.rows[0].deriv_token;

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

