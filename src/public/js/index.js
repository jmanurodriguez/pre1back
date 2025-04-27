const socket = io();

const formNewProduct = document.getElementById("formNewProduct");
const productsList = document.getElementById("productsList");

// Actualizar la lista completa de productos
socket.on("products", (products) => {
    productsList.innerHTML = products.map(product => `
        <div class="col">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-text">
                        <strong>Precio:</strong> $${product.price}
                    </p>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
});

// Manejar el envío del formulario para nuevo producto
formNewProduct.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(formNewProduct);
    const productData = {};

    formData.forEach((value, key) => {
        productData[key] = key === 'price' || key === 'stock' 
            ? Number(value) 
            : value;
    });

    socket.emit("newProduct", productData);
    formNewProduct.reset();
});

// Función para eliminar producto
function deleteProduct(id) {
    socket.emit("deleteProduct", id);
}

// Manejar productos agregados individualmente
socket.on("productAdded", (newProduct) => {
    const productHtml = `
        <div class="col">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${newProduct.title}</h5>
                    <p class="card-text">
                        <strong>Precio:</strong> $${newProduct.price}
                    </p>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${newProduct.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    productsList.innerHTML += productHtml;
});

socket.on("error", (error) => {
    alert("Error: " + error);
});