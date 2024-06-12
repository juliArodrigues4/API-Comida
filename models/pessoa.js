const mongoose = require("mongoose");

const Comida = mongoose.model("Comida", {
    login: String,
    pass: String,
    tipo: String,
    nome: String,
    preco: Number,
    descricao: String,
});

module.exports = Comida;