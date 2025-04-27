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

//handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

//puerto de nuestro servidor
const PORT = 8080;
//habilitamos poder recibir json
app.use(express.json());
//habilitamos la carpeta public
app.use(express.static(path.join(__dirname, "public")));

//endpoints
app.use("/api/products", productsRouter);
app.use("/api/carts", cartRouter);
app.use("/", viewsRouter);

//websockets
const productManager = new ProductManager();

io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado");

    // Enviar lista inicial de productos
    productManager.getProducts().then(products => {
        socket.emit("products", products);
    });

    socket.on("newProduct", async(productData) => {
        try {
            const newProduct = await productManager.addProduct(productData);
            // Emitir el nuevo producto individualmente
            io.emit("productAdded", newProduct);
            
            // Actualizar la lista completa
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
            // Actualizar la lista después de eliminar
            const products = await productManager.getProducts();
            io.emit("products", products);
        } catch (error) {
            socket.emit("error", error.message);
            console.error("Error al eliminar el producto:", error);
        }
    });
});

//iniciamos el servidor y escuchamos en el puerto definido
server.listen(PORT, () => {
    console.log(`Servidor iniciado en: http://localhost:${PORT}`);
});