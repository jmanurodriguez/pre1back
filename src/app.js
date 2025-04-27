import express from "express";
import productsRouter from "./routes/products.router.js";
import cartRouter from "./routes/cart.router.js";
import viewsRouter from "./routes/views.router.js";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import http from "http";
import ProductManager from "./managers/ProductManager.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

const PORT = 8080;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/products", productsRouter);
app.use("/api/carts", cartRouter);
app.use("/", viewsRouter);


const productManager = new ProductManager();

io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado");

    
    productManager.getProducts().then(products => {
        socket.emit("products", products);
    });

    socket.on("newProduct", async(productData) => {
        try {
            const newProduct = await productManager.addProduct(productData);
            
            io.emit("productAdded", newProduct);
            
           
            const products = await productManager.getProducts();
            io.emit("products", products);
        } catch (error) {
            socket.emit("error", error.message);
            console.error("Error al añadir el producto:", error);
        }
    });

    socket.on("deleteProduct", async(id) => {
        try {
            await productManager.deleteProductById(parseInt(id));
       
            const products = await productManager.getProducts();
            io.emit("products", products);
        } catch (error) {
            socket.emit("error", error.message);
            console.error("Error al eliminar el producto:", error);
        }
    });
});


server.listen(PORT, () => {
    console.log(`Servidor iniciado en: http://localhost:${PORT}`);
});