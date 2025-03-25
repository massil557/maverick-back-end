const argon2 = require("argon2");

async function hashPassword(password) {
    try {
        const hash = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });
        console.log("Hashed password:", hash);
        return hash;
    } catch (err) {
        console.error("Error hashing password:", err);
    }
}
async function verifyPassword(hash, password) {
    try {
        return await argon2.verify(hash, password)

    } catch (err) {
        console.error("Error verifying password:", err);
    }
}

module.exports = { hashPassword, verifyPassword }

