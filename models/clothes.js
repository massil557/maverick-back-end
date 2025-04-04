
const { mongoose } = require('mongoose');
const { Product, NewProduct } = require('./product');

const ClothesSchema = new mongoose.Schema({
    checkedS: { type: Boolean, required: true },
    checkedM: { type: Boolean, required: true },
    checkedL: { type: Boolean, required: true },
    checkedXL: { type: Boolean, required: true },
})

const Clothes = Product.discriminator('Clothes', ClothesSchema);
const NewClothes = NewProduct.discriminator('NewClothes', ClothesSchema)
module.exports = { Clothes, NewClothes }