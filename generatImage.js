const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const getBackgroundColor = (letter) => {
    const colors = {
        A: '#FF5733', B: '#33FF57', C: '#3357FF', D: '#FF33A1', E: '#A133FF',
        F: '#33FFF5', G: '#F5FF33', H: '#FF8C33', I: '#8C33FF', J: '#33FF8C',
        K: '#FF3333', L: '#33A1FF', M: '#A1FF33', N: '#FF33F5', O: '#F533FF',
        P: '#33FFA1', Q: '#FFA133', R: '#33F5FF', S: '#FF5733', T: '#5733FF',
        U: '#33FF33', V: '#FF33FF', W: '#33FF57', X: '#FF8C57', Y: '#8C57FF',
        Z: '#57FF8C'
    };
    return colors[letter.toUpperCase()] || '#CCCCCC';
};

const generateProfilePicture = (username) => {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    const firstLetter = username.charAt(0).toUpperCase();
    const backgroundColor = getBackgroundColor(firstLetter);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstLetter, canvas.width / 2, canvas.height / 2);

    const imagesDir = path.resolve(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    const fileName = `${username}_${Date.now()}_profile.png`;
    const imagePath = path.resolve(imagesDir, fileName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);

    return `http://localhost:3000/images/${fileName}`;
};

module.exports = generateProfilePicture;