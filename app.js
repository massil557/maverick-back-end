const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 3000;
const cors = require('cors');
const User = require('./models/user');
const RefreshToken = require('./models/refreshToken');
const MagazineInscription = require('./models/magazineInscription');
const { hashPassword, verifyPassword } = require('./password')
const generateTokens = require('./gTokens');
const authMiddleware = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const generateProfilePicture = require('./generatImage');
const mongoURI = 'mongodb://localhost:27017/maverick';

const multer = require('multer')


app.use('/images', express.static('./images'));
app.use('/uploads', express.static('uploads'));
mongoose.connect(mongoURI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(err => console.error('Erreur de connexion à MongoDB :', err));

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/client/signup', async (req, res) => {
    console.log(req.body)
    const { email, phone, username, address, password, sex, accountType } = req.body
    try {
        const newUser = new User({
            username: username,
            email: email,
            phone: phone,
            password: await hashPassword(password),
            sex: sex,
            role: accountType,
            address: address,
            imagePath: generateProfilePicture(username)
        });
        const savedUser = await newUser.save();
        console.log(savedUser);
        const user = { username: username, email: email }
        const { accessToken, refreshToken } = await generateTokens(user);
        res.status(201).json({ accessToken, refreshToken, savedUser });


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post("/api/logout", authMiddleware, async (req, res) => {
    console.log(req.body)
    const { token } = req.body;


    if (!token) return res.status(400).json({ message: "Token is required" });

    await RefreshToken.deleteOne({ refreshToken: token });

    res.json({ message: "Logged out successfully" });
});



app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const result = await User.findOne({ email: email })
        if (!result) return res.status(404).send('user not found')
        const isAuth = await verifyPassword(result.password, password);
        if (!isAuth) {
            return res.status(401).send('wrong password');
        }
        console.log(result.username, result.email);
        const { accessToken, refreshToken } = await generateTokens({ username: result.username, email: result.email });
        res.status(201).json({ accessToken, refreshToken, result });



    } catch (error) {
        res.status(500).json({ error: error.message });
    }


})

app.post('/magazine/inscription', async (req, res) => {

    const {
        email,
        phone,
        username,
        address,
        product,
        password,
        sex,
        accountType,
        businessName,
        accountHolderName,
        bankAccountNumber,
        bankRoutingNumber,
        taxId
    } = req.body

    try {
        const newInscription = new MagazineInscription({
            email: email,
            phone: phone,
            username: username,
            password: await hashPassword(password),
            sex: sex,
            address: address,
            product: product,
            role: accountType,
            businessName: businessName,
            accountHolderName: accountHolderName,
            bankAccountNumber: bankAccountNumber,
            bankRoutingNumber: bankRoutingNumber,
            taxId: taxId
        });
        console.log(newInscription)
        await newInscription.save();
        res.status(201).send('success')
    } catch (error) {
        res.status(500).send(error.message)
    }

})




app.post('/token', async (req, res) => {
    const { token } = req.body;
    console.log(token)
    if (!token) {
        return res.status(401).json({ message: 'Refresh token requis.' });
    }

    try {
        // Vérifiez si le refresh token existe dans la base de données
        const storedToken = await RefreshToken.findOne({ refreshToken: token });
        console.log(storedToken)
        if (!storedToken) {
            return res.status(404).json({ message: 'Refresh token invalide.' });
        }

        // Vérifiez et décodez le refresh token
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Refresh token invalide ou expiré.' });
            }

            // Générer un nouvel access token
            const accessToken = jwt.sign(
                { username: user.username, email: user.email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' } // Durée de validité de l'access token
            );
            console.log(`access token is ${accessToken}`)

            res.status(200).json({ accessToken });
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur interne du serveur.', error: err.message });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({ storage });


app.post('/api/products', upload.array('images', 10), (req, res) => {
    try {

        console.log(req.body)
        console.log(req.files)
        res.status(200).json(req.files);
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});
const Product = require('./models/product')
const Clothes = require('./models/clothes')


app.post('/api/products/details', async (req, res) => {
    console.log(req.body.updatedProduct);
    if (req.body.updatedProduct.category === 'Fashion') {
        const { idMagazine,
            name,
            brand,
            price,
            details,
            category,
            gender,
            available,
            checkedS,
            checkedM,
            checkedL,
            checkedXL } = req.body.updatedProduct;

        const newClothes = new Clothes({
            idMagazine: idMagazine,
            name: name,
            brand: brand,
            price: price,
            details: details,
            category: category,
            gender: gender,
            available: available,
            checkedS: checkedS,
            checkedM: checkedM,
            checkedL: checkedL,
            checkedXL: checkedXL

        })
        try {
            console.log(`this is why ${newClothes}`)
            await newClothes.save()
            res.status(200).json({ message: "success" });
        } catch (error) {
            console.log(error)
        }
    } else {
        const {
            idMagazine,
            name,
            brand,
            price,
            details,
            category,
            gender,
            available } = req.body.updatedProduct
        const newProduct = new Product({
            idMagazine: idMagazine,
            name: name,
            brand: brand,
            price: price,
            details: details,
            category: category,
            gender: gender,
            available: available,


        })
        try {
            await newProduct.save()
            res.status(200).json();

        } catch (error) {
            console.log(error)
        }



    }
})


app.get('/api/getProduct', async (req, res) => {
    try {
        const result = await Product.find({});
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "we had an error in the server" })
    }

})


app.get('/api/product/details/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
