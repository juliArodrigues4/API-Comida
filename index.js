const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const Comida = require('./models/pessoa');
const Payment = require('./models/pagamento');

const cipher = {
    algorithm: "aes256",
    secret: "chaves",
    type: "hex"
}

async function getCrypto(data) {
    return new Promise((resolve, reject) => {
        const cipherStream = crypto.createCipher(cipher.algorithm, cipher.secret);
        let encryptedData = '';

        cipherStream.on('readable', () => {
            let chunk;
            while (null !== (chunk = cipherStream.read())) {
                encryptedData += chunk.toString(cipher.type);
            }
        });

        cipherStream.on('end', () => {
            resolve(encryptedData);
        });

        cipherStream.on('error', (error) => {
            reject(error);
        });

        cipherStream.write(data);
        cipherStream.end();
    });
}

// Criar o app
const app = express();

// Configurar a API para ler json
app.use(express.urlencoded({
    extended: true
}));

// Permitindo que a API retorne um json e não um xml
app.use(express.json());

// Conexão com o banco
let url = "mongodb://localhost:27017";
mongoose.connect(url)
    .then(() => {
        console.log("Conectamos no banco!!")
        app.get('/', (rep, res) => {
            res.json({ message: "Olá, mundo" });
        })
    }).catch((error) => {
        console.log(error)
    })

// Rotas
app.post('/pessoa', async (req, res) => {
    const { login, pass, tipo, nome, preco, descricao } = req.body;

    const comida = {
        login,
        pass,
        tipo,
        nome,
        preco,
        descricao,
    }

    try {
        let newPass = await getCrypto(pass);
        const comida = {
            login,
            pass: newPass,
            tipo,
            nome,
            preco,
            descricao
        };
        await Comida.create(comida);
        res.status(201).json({ message: 'Comida inserida no sistema com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: error });
    }
})

app.get('/pessoa', async (req, res) => {
    try {
        const people = await Comida.find();
        res.status(200).json(people);
    } catch (error) {
        res.status(500).json({ erro: error });
    }
})

app.get('/pessoa/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const comida = await Comida.findOne({ _id: id })
        if (!comida) {
            res.status(422).json({ message: 'Usuário não encontrado' })
            return
        }
        res.status(200).json(comida)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

app.patch('/pessoa/:id', async (req, res) => {
    const { login, pass, tipo, nome, preco, descricao } = req.body;
    const id = req.params.id;
    const comida = {
        login,
        pass,
        tipo,
        nome,
        preco,
        descricao
    }

    try {
        const updatedComida = await Comida.updateOne({ _id: id }, comida)
        if (updatedComida.matchedCount === 0) {
            res.status(422).json({ message: 'Comida não encontrada' })
            return
        }
        res.status(200).json(comida)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

app.delete('/pessoa/:id', async (req, res) => {
    const id = req.params.id

    const comida = await Comida.findOne({ _id: id });

    if (!comida) {
        res.status(422).json({ message: 'Comida não encontrada' })
        return
    }
    try {
        await Comida.deleteOne({ _id: id })
        res.status(200).json({ message: 'Comida removida com sucesso' })
    } catch (error) {
        res.status(500).json({ erro: error })
    }
});

app.post('/pagamento', async (req, res) => {
    const { oficialName, paymentType, number, securityCode, valor } = req.body;

    try {
        const encryptedNumeroCartao = await getCrypto(number);
        const encryptedCodigoSeguranca = await getCrypto(securityCode);

        const payment = {
            oficialName,
            paymentType,
            number: encryptedNumeroCartao,
            securityCode: encryptedCodigoSeguranca,
            valor
        };

        await Payment.create(payment);

        res.status(200).json({ message: 'Pagamento recebido com sucesso', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    let { email, pass } = req.body;
    try {
        let encryptedPass = await getCrypto(pass);
        const comida = await Comida.findOne({ email, pass: encryptedPass });

        if (!comida) {
            res.status(422).json({ message: 'Credenciais inválidas' });
            return;
        }

        res.status(200).json({ message: 'Usuário Logado', user: comida });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
});

// Nova rota para ler pagamentos
app.get('/pagamento', async (req, res) => {
    try {
        const payments = await Payment.find();
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deixar API pública
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
