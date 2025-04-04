const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    sex: { type: String, enum: ['male', 'female'], required: true },
    role: { type: String, enum: ['client', 'magazine', 'admin', 'superAdmin'], required: true },
    favorite: { type: [String], default: [] },
    imagePath: { type: [String], default: '' },
    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('User', userSchema);