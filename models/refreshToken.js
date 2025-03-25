const mongoose = require('mongoose');

const refreshSchema = new mongoose.Schema({
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('RefreshToken', refreshSchema);