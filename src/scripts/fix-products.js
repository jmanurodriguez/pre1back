import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo products.json
const productsFilePath = path.join(__dirname, '../data/products.json');

// Leer el archivo
try {
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    const products = JSON.parse(data);
    
    // Eliminar el campo id de cada producto
    const productsWithoutId = products.map(product => {
        // Desestructurar para excluir el campo id
        const { id, ...productWithoutId } = product;
        
        // Asegurarnos de que thumbnail está definido correctamente
        // Verificamos si ya hay thumbnails o si debemos usar thumbnail
        if (product.thumbnail && !productWithoutId.thumbnails) {
            productWithoutId.thumbnails = [product.thumbnail];
        }
        
        return productWithoutId;
    });
    
    // Escribir el archivo actualizado
    fs.writeFileSync(productsFilePath, JSON.stringify(productsWithoutId, null, 2));
    
    console.log('✅ Campo id eliminado correctamente de todos los productos.');
} catch (error) {
    console.error('❌ Error al procesar el archivo products.json:', error.message);
}