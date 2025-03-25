const jwt = require('jsonwebtoken');
require('dotenv').config();
const RefreshToken = require('./models/refreshToken');

const generateTokens = async (user) => {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    const newRefreshToken = new RefreshToken({ refreshToken: refreshToken });
    await newRefreshToken.save();
    return { accessToken, refreshToken };
};

module.exports = generateTokens;