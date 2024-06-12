const mongoose = require("mongoose");

const Payment = mongoose.model("Payment", {
    oficialName: String,
    paymentType: String,
    number: Buffer, // Alterado para Buffer
    securityCode: Buffer, // Alterado para Buffer
    valor: Number,
});

module.exports =  Payment;