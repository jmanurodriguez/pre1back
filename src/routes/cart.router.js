import express from "express";
import CartManager from "../managers/CartManager.js";

const cartRouter = express.Router();
const cartManager = new CartManager();

cartRouter.post("/", async(req, res) => {
    try {
        const carts = await cartManager.addCart();
        res.status(201).send(carts);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

cartRouter.get("/:cid", async(req, res) => {
    try {
        const cart = await cartManager.getCartById(req.params.cid);
        res.status(200).send(cart);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

cartRouter.post("/:cid/product/:pid", async(req, res) => {
    try {
        const productToAdd = {
            id: parseInt(req.params.pid),
            quantity: req.body.quantity || 1
        };
        
        const updatedCart = await cartManager.addProductInCartById(req.params.cid, productToAdd);
        res.status(201).send(updatedCart);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

export default cartRouter;