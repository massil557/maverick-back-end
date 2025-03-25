
const { mongoose } = require('mongoose');
const ProductSchema = require('./product');

const ClothesSchema = new mongoose.Schema({
    checkedS: { type: Boolean, required: true },
    checkedM: { type: Boolean, required: true },
    checkedL: { type: Boolean, required: true },
    checkedXL: { type: Boolean, required: true },
})

module.exports = ProductSchema.discriminator('Clothes', ClothesSchema);