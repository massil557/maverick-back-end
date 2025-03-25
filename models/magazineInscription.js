const mongoose = require('mongoose');

const insSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    sex: { type: String, enum: ['male', 'female'], required: true },
    role: { type: String, enum: ['client', 'magazine', 'admin', 'superAdmin'], required: true },
    favorite: { type: [String], default: [] },
    product: { type: String, enum: ['men', 'women', 'both'], required: true },
    businessName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    bankAccountNumber: { type: Number, required: true },
    bankRoutingNumber: { type: Number, required: true },
    taxId: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }


});
module.exports = mongoose.model('MagazineInscription', insSchema);