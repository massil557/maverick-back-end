const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Récupère le token après "Bearer"
    console.log(token)
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé : Aucun token fourni.' });
    }

    try {

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log(decoded)
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;