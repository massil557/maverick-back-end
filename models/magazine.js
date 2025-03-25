const { default: mongoose } = require('mongoose');
const User = require('./user');

const Magazine = new mongoose.Schema({
    product: { type: String, enum: ['men', 'women', 'both'], required: true },
    businessName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    bankAccountNumber: { type: Number, required: true },
    bankRoutingNumber: { type: Number, required: true },
    taxId: { type: Number, required: true }
})

module.exports = User.discriminator('Magazine', Magazine);