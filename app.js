const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cron = require('node-cron');
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
const Magazine = require('./models/magazine')
const multer = require('multer')
const fs = require('fs');
const path = require('path');
const axios = require('axios');




// 🔽 Créer un flux d'écriture vers un fichier
// const accessLogStream = fs.createWriteStream('./logs/access.log', { flags: 'a' });

app.use('/images', express.static('./images'));
app.use('/uploads', express.static('uploads'));
app.use(cors());

// app.use(morgan('combined', { stream: accessLogStream }));

mongoose.connect(mongoURI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(err => console.error('Erreur de connexion à MongoDB :', err));

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});


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
        const user = { username: username, email: email, role: accountType }
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
        console.log(result.username, result.email, result.role);
        const { accessToken, refreshToken } = await generateTokens({ username: result.username, email: result.email, role: result.role });
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
                { username: user.username, email: user.email, role: user.role },
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
const { Product, NewProduct } = require('./models/product')
const { Clothes, NewClothes } = require('./models/clothes')


app.post('/api/products/details', async (req, res) => {
    console.log(req.body.updatedProduct);
    if (req.body.updatedProduct.category === 'Fashion') {
        const { idMagazine,
            name,
            brand,
            price,
            details,
            category,
            subcategory,
            gender,
            available,
            checkedS,
            checkedM,
            checkedL,
            checkedXL } = req.body.updatedProduct;

        const newClothes = new NewClothes({
            idMagazine: idMagazine,
            name: name,
            brand: brand,
            price: price,
            details: details,
            category: category,
            subcategory: subcategory,
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
            subcategory,
            gender,
            available } = req.body.updatedProduct
        const newProduct = new NewProduct({
            idMagazine: idMagazine,
            name: name,
            brand: brand,
            price: price,
            details: details,
            category: category,
            subcategory: subcategory,
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

app.put('/api/user/favorite', async (req, res) => {
    const { userId, newFavorite } = req.body
    console.log({ userId, newFavorite })
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { favorite: newFavorite } },
            { new: true } // Returns the updated document
        )
        if (!updatedUser) {
            return res.status(400).json({ message: "user not found" })
        }
        res.status(200).json({ message: "favorite updated" })
    } catch (error) {
        res.status(500).json({ message: "we had an error in favorite" })

    }

})
app.put('/api/user/rFavorite', async (req, res) => {
    const { userId, newFavorite } = req.body
    console.log({ userId, newFavorite })
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { favorite: newFavorite } },
            { new: true } // Returns the updated document
        )
        if (!updatedUser) {
            return res.status(400).json({ message: "user not found" })
        }
        res.status(200).json({ message: "favorite updated" })
    } catch (error) {
        res.status(500).json({ message: "we had an error in favorite" })

    }

})
app.get('/api/favoriteProduct/:id', async (req, res) => {
    const userId = req.params.id;
    const fProductsIds = await User.findById(userId, { favorite: 1, _id: 0 });
    res.status(200).json(fProductsIds);

})

app.get('/api/favoriteProductBulk/:fProductsIds', async (req, res) => {
    const userIds = JSON.parse(req.params.fProductsIds);
    const fProducts = await Product.find({ _id: { $in: userIds } });
    res.status(200).json({ fProducts });

})

app.get('/api/myProducts/:id', async (req, res) => {
    const magazineId = req.params.id;
    const MyProducts = await Product.find({
        idMagazine: magazineId
    });
    res.status(200).json({ MyProducts });

})


app.put('/approveProduct/:id', authMiddleware, async (req, res) => {
    console.log(req.user.role)
    if (req.user.role !== 'admin') {
        return res.status(406).json({ message: "only admins request" })
    }

    const productId = req.params.id
    try {
        const approvedProduct = await NewProduct.findOneAndDelete({
            _id: productId
        })
        if (!approvedProduct) {
            res.status(404).json({ message: 'product not found' })
        }

        const { idMagazine,
            name,
            brand,
            price,
            details,
            category,
            subcategory,
            gender,
            available,
            checkedS,
            checkedM,
            checkedL,
            checkedXL } = approvedProduct;


        if (category === 'Fashion') {
            const newClothes = new Clothes({
                idMagazine: idMagazine,
                name: name,
                brand: brand,
                price: price,
                details: details,
                category: category,
                subcategory: subcategory,
                gender: gender,
                available: available,
                checkedS: checkedS,
                checkedM: checkedM,
                checkedL: checkedL,
                checkedXL: checkedXL

            })
            await newClothes.save()
            res.status(200).json({ message: "product approved" })

        } else {
            const newProduct = new Product({
                idMagazine: idMagazine,
                name: name,
                brand: brand,
                price: price,
                details: details,
                category: category,
                subcategory: subcategory,
                gender: gender,
                available: available,


            })
            await newProduct.save();
            res.status(200).json({ message: `approved` })

        }

    } catch (error) {
        res.status(500).json({ message: `server error` })

    }

})




app.put('/rejectedProduct/:id', authMiddleware, async (req, res) => {
    console.log(req.user.role)
    if (req.user.role !== 'admin') {
        return res.status(406).json({ message: "only admins request" })
    }

    const productId = req.params.id
    try {
        const RejectedProduct = await NewProduct.deleteOne({
            _id: productId
        })
        if (!RejectedProduct) {
            return res.status(404).json({ message: 'product not found' })
        }
        res.status(200).json({ message: 'product rejected' })
    } catch (error) {
        res.status(500).json({ message: `server error` })

    }

})


app.get('/api/NewProducts', async (req, res) => {
    try {
        const newProducts = await NewProduct.find({})
        if (!newProducts) {
            return res.status(404).json({ message: 'there is no new products  ' })
        }
        res.status(200).json(newProducts)
    } catch (error) {
        return res.status(500).json({ message: `error at the server` })
    }

})

app.get('/api/newProduct/details/:id', async (req, res) => {
    const productId = req.params.id

    try {
        const newProduct = await NewProduct.findById(productId)
        if (!newProduct) {
            return res.status(404).json({ message: 'there is no new products  ' })
        }
        res.status(200).json(newProduct)
    } catch (error) {
        return res.status(500).json({ message: `error at the server` })
    }

})

app.get('/api/newMagazines', async (req, res) => {
    try {
        const newMagazines = await MagazineInscription.find();
        if (!newMagazines) {
            return res.status(404).json({ message: "there is no new magazines" })
        }
        res.status(200).json(newMagazines)
    } catch (error) {
        res.status(500).json({ message: 'error in the server' })
    }



})

app.get(
    '/api/newMagazine/details/:id', async (req, res) => {
        const magazineId = req.params.id
        try {
            const newMagazine = await MagazineInscription.findById(magazineId);
            if (!newMagazine) {
                return res.status(404).json({ message: "there is no new magazines" })
            }
            res.status(200).json(newMagazine)

        } catch (error) {
            res.status(500).json({ message: 'error in the server' })

        }

    })

app.put('/approve/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(406).json({ message: "only admins request" })
    }
    const magId = req.params.id
    try {
        const newMag = await MagazineInscription.findOneAndDelete({ _id: magId });

        if (!newMag) {
            return res.status(404).json({ message: 'element not found' })
        }
        const {
            username,
            email,
            password,
            phone,
            address,
            sex,
            role,
            favorite,
            product,
            businessName,
            accountHolderName,
            bankAccountNumber,
            bankRoutingNumber,
            taxId
        } = newMag

        const newMagazine = new Magazine({
            username: username,
            email: email,
            password: password,
            phone: phone,
            address: address,
            sex: sex,
            role: role,
            favorite: favorite,
            product: product,
            businessName: businessName,
            accountHolderName: accountHolderName,
            bankAccountNumber: bankAccountNumber,
            bankRoutingNumber: bankRoutingNumber,
            taxId: taxId,
            imagePath: generateProfilePicture(username)

        })
        console.log(newMagazine)
        newMagazine.save()
        res.status(200).json({ message: 'ok' })
    } catch (error) {
        res.status(500).json({ message: 'server error' })

    }

})


app.put('/reject/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(406).json({ message: "only admins request" })
    }
    const magId = req.params.id


    try {
        const newMag = await MagazineInscription.findOneAndDelete({ _id: magId });
        if (!newMag) {
            return res.status(404).json({ message: 'element not found' })
        }
        res.status(200).json({ message: 'deleted' })

    } catch (error) {
        res.status(500).json({ message: 'server error' })

    }

})


app.post('/api/products/report/:productId', async (req, res) => {
    try {
        const { reason } = req.body;

        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.reports.push({ userId: req.body.userId, reason });
        product.signalCount += 1;
        await product.save();

        res.json({ message: 'Report submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/products/reported', async (req, res) => {
    try {
        const reportedProducts = await Product.find({ signalCount: { $gt: 3 } });
        res.json(reportedProducts);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.put('/api/products/report/:id', authMiddleware, async (req, res) => {
    console.log(req.user.role)
    if (req.user.role !== 'admin') {
        return res.status(406).json({ message: "only admins request" })
    }
    const prodId = req.params.id
    try {
        const result = await Product.findByIdAndDelete(prodId)
        console.log(result)
        res.status(200).json({ message: 'product deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})
app.post('/api/products/report/keep/:id', async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.signalCount = 0;
        await product.save();

        res.json({ message: 'product is kept' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

// the comment section 

app.post('/api/comments/:productId', async (req, res) => {
    const { userId, text } = req.body
    const productId = req.params.productId
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const comment = {
            userId: userId,
            text: text,
            createdAt: new Date()
        };

        product.comments.push(comment);
        await product.save();

        res.status(201).json({ message: 'Comment added successfully', comment });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

})


app.get('/api/comments/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const commentsWithUserDetails = await Promise.all(
            product.comments.map(async (comment) => {
                const user = await User.findById(comment.userId, { username: 1, imagePath: 1 });
                return {
                    ...comment._doc,
                    username: user?.username || 'Unknown User',
                    imagePath: user?.imagePath || null
                };
            })
        );
        res.status(200).json(commentsWithUserDetails);
        // res.status(200).json(product.comments);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.post('/rate-product/:productId', async (req, res) => {
    const { productId } = req.params;
    const { userId, value } = req.body;

    if (!userId || typeof value !== 'number') {
        return res.status(400).json({ error: 'userId and value are required.' });
    }

    try {
        // 1. Try to update existing rating
        const updateResult = await Product.updateOne(
            { _id: productId, 'productRate.userId': userId },
            { $set: { 'productRate.$.value': value } }
        );

        // 2. If no match, push new rating
        if (updateResult.modifiedCount === 0) {
            await Product.updateOne(
                { _id: productId },
                { $push: { productRate: { userId, value } } }
            );
        }

        // 3. Re-fetch the product to get updated ratings
        const updatedProduct = await Product.findById(productId);

        const ratings = updatedProduct.productRate.map(rate => rate.value);
        const avg = ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length;
        const flooredAvg = Math.floor(avg);

        // 4. Save floored average to the product's rating field
        updatedProduct.rating = flooredAvg;
        await updatedProduct.save();

        res.status(200).json({ message: 'Rating recorded.', newRating: flooredAvg });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.post('/add-to-cart/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        // Increment score by 1 for the product
        await Product.updateOne(
            { _id: productId },
            { $inc: { score: 1 } }
        );
        res.status(200).json({ message: 'Product added to cart, score incremented!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

cron.schedule('0 0 * * 1', async () => {
    try {
        await Product.updateMany({}, { $set: { score: 0 } });
        console.log('Weekly product scores reset.');
    } catch (err) {
        console.error('Failed to reset scores:', err);
    }
});


app.get('/top-sellers', async (req, res) => {
    try {
        const topProducts = await Product.find()
            .sort({ score: -1 })
            .limit(6)
            .select('name score');

        res.json(topProducts);
    } catch (error) {
        console.error("Failed to fetch top sellers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get('/top-rated', async (req, res) => {
    try {
        const topRated = await Product.find()
            .sort({ rating: -1 })
            .limit(5)
            .select('name rating');

        res.json(topRated);
    } catch (error) {
        console.error("Failed to fetch top-rated products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/products/most-reported
app.get('/most-reported', async (req, res) => {
    try {
        const mostReported = await Product.find()
            .sort({ signalCount: -1 })
            .limit(5)
            .select('name signalCount');

        res.json(mostReported);
    } catch (error) {
        console.error("Failed to fetch most-reported products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get('/stock', async (req, res) => {
    try {
        const products = await Product.find().select('name available');

        const productStocks = products.map(product => {
            const totalStock = product.available.reduce((acc, item) => acc + item.quantity, 0);
            return { name: product.name, totalStock };
        });

        res.json(productStocks);
    } catch (error) {
        console.error("Failed to fetch stock data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/user-stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: 'client' });
        const magazineCount = await User.countDocuments({ role: 'magazine' });

        res.json({
            users: userCount,
            magazines: magazineCount
        });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


