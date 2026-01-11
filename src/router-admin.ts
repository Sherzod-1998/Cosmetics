/* eslint-disable prettier/prettier */
import express from 'express';
const routerAdmin = express.Router();
import productController from './controllers/product.controller';
import sellerController from './controllers/seller.controller';
import makeUploader from './libs/utils/uploader';

/* Seller */
routerAdmin.get('/', sellerController.goHome);

routerAdmin
    .get('/login', sellerController.getLogin)
    .post('/login', sellerController.processLogin);

routerAdmin
	.get('/signup', sellerController.getSignup)
	.post('/signup', makeUploader('members').single('memberImage'), sellerController.processSignup);

routerAdmin.get('/logout', sellerController.logout);
routerAdmin.get('/check-me', sellerController.checkAuthSession);
/** Product */

// Product
routerAdmin.get('/product/all', sellerController.verifySeller, productController.getAllProducts);

routerAdmin.post("/product/create",
    sellerController.verifySeller,
    makeUploader("products").array("productImages", 5),
    productController.createNewProduct);

routerAdmin.post('/product/:id',
     sellerController.verifySeller, 
     makeUploader("products").array("productImage", 5),
     productController.updateChosenProduct);

// User
routerAdmin.get(
    "/user/all", 
    sellerController.verifySeller, 
    sellerController.getUsers);

    routerAdmin.post(
        "/user/edit", 
        sellerController.verifySeller, 
        sellerController.updateChosenUser);
/** User */
export default routerAdmin;
