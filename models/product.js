const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    color: { type: String },
    quantity: { type: Number },
    path: { type: String, required: true }
});


const productSchema = new mongoose.Schema({
    idMagazine: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    details: { type: String, required: true },
    category: { type: String, enum: ['Fashion', 'Beauty', 'Fragrances'], required: true },
    gender: { type: String, enum: ['men', 'women', 'both'], required: true },
    available: { type: [itemSchema], default: [], required: true },
    score: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isOnSale: { type: Boolean, default: false },
    amount: { type: Number, min: 0, max: 0.99, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);

