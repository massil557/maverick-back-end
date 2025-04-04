const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
    color: { type: String },
    quantity: { type: Number },
    path: { type: String, required: true }
});

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, enum: ['Fake', 'Misleading', 'Inappropriate', 'Other'] },
    createdAt: { type: Date, default: Date.now }
});


const productSchema = new mongoose.Schema({
    idMagazine: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    details: { type: String, required: true },
    category: { type: String, enum: ['Fashion', 'Beauty', 'Fragrances', 'Accessories'], required: true },
    gender: { type: String, enum: ['men', 'women', 'both'], required: true },
    available: { type: [itemSchema], default: [], required: true },
    score: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    signalCount: { type: Number, min: 0, default: 0 },
    reports: { type: [reportSchema], default: [] },
    isOnSale: { type: Boolean, default: false },
    amount: { type: Number, min: 0, max: 0.99, default: 0 },
    comments: { type: [commentSchema], default: [] }
});


const Product = mongoose.model('Product', productSchema);
const NewProduct = mongoose.model('NewProduct', productSchema);


module.exports = { Product, NewProduct }

