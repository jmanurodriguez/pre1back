# 🛒 Ecommerce Backend - Proyecto Final

## 📋 Descripción

Backend completo para ecommerce desarrollado con Node.js, Express, MongoDB y sistema de autenticación JWT con Passport.js.

## ✨ Características Principales

- 🔐 **Sistema de Autenticación JWT** completo
- 👥 **Gestión de Usuarios** con roles (user/admin)
- 🛍️ **CRUD de Productos** con paginación
- 🛒 **Sistema de Carritos** de compra
- 🔒 **Rutas Protegidas** por roles
- 🔐 **Encriptación de Contraseñas** con bcrypt
- 📊 **Base de datos MongoDB** con Mongoose
- 🧪 **Suite de Tests** automatizados

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd proyecto-final
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` con:
```env
MONGO_URI=tu_uri_de_mongodb
PORT=8080
JWT_SECRET=tu_clave_secreta_jwt
```

### 4. Iniciar el servidor
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 🧪 Pruebas

Ejecutar suite de tests del sistema de autenticación:
```bash
npm test
```

## 📚 API Endpoints

### 🔐 Autenticación
- `POST /api/sessions/register` - Registro de usuarios
- `POST /api/sessions/login` - Inicio de sesión
- `GET /api/sessions/current` - Usuario actual (protegida)
- `POST /api/sessions/logout` - Cerrar sesión

### 👥 Usuarios (Solo Admin)
- `GET /api/users` - Listar usuarios
- `GET /api/users/:uid` - Obtener usuario
- `PUT /api/users/:uid` - Actualizar usuario
- `DELETE /api/users/:uid` - Eliminar usuario

### 🛍️ Productos
- `GET /api/products` - Listar productos (con paginación)
- `GET /api/products/:pid` - Obtener producto
- `POST /api/products` - Crear producto
- `PUT /api/products/:pid` - Actualizar producto
- `DELETE /api/products/:pid` - Eliminar producto

### 🛒 Carritos
- `POST /api/carts` - Crear carrito
- `GET /api/carts/:cid` - Obtener carrito
- `POST /api/carts/:cid/product/:pid` - Agregar producto
- `PUT /api/carts/:cid/products/:pid` - Actualizar cantidad
- `DELETE /api/carts/:cid/products/:pid` - Eliminar producto
- `DELETE /api/carts/:cid` - Vaciar carrito

## 🔧 Estructura del Proyecto

```
src/
├── config/
│   ├── database.js          # Conexión MongoDB
│   └── passport.config.js   # Configuración Passport
├── middlewares/
│   └── auth.js             # Middlewares de autorización
├── models/
│   ├── user.model.js       # Modelo Usuario
│   ├── product.model.js    # Modelo Producto
│   └── cart.model.js       # Modelo Carrito
├── routes/
│   ├── sessions.router.js  # Rutas autenticación
│   ├── users.router.js     # CRUD usuarios
│   ├── products.router.js  # Rutas productos
│   ├── cart.router.js      # Rutas carritos
│   └── views.router.js     # Rutas vistas
├── tests/
│   └── auth-test.js        # Tests del sistema
├── utils/
│   ├── auth.js             # Utilidades autenticación
│   └── handlebars-helpers.js
├── views/                  # Templates Handlebars
└── app.js                  # Aplicación principal
```

## 🔐 Sistema de Autenticación

### Modelo de Usuario
```javascript
{
  first_name: String,
  last_name: String,
  email: String (único),
  age: Number,
  password: String (hasheado),
  cart: ObjectId (referencia a Cart),
  role: String (default: 'user')
}
```

### Flujo de Autenticación
1. **Registro**: Crear usuario con contraseña encriptada
2. **Login**: Validar credenciales y generar JWT
3. **Acceso**: Usar JWT para rutas protegidas
4. **Autorización**: Validar roles para acciones específicas

## 🛡️ Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con expiración de 24h
- ✅ Cookies httpOnly
- ✅ Validación de datos de entrada
- ✅ Rutas protegidas por roles
- ✅ Variables de entorno para secretos

## 👨‍💻 Crear Administrador

Para crear un usuario administrador:

```javascript
// En MongoDB Compass o shell
db.users.updateOne(
  { email: "admin@example.com" }, 
  { $set: { role: "admin" } }
)
```

## 📄 Documentación Adicional

Ver `AUTH_SYSTEM.md` para documentación detallada del sistema de autenticación.

## 🚀 Comandos NPM

```bash
npm start       # Iniciar servidor
npm run dev     # Modo desarrollo (nodemon)
npm test        # Ejecutar tests
```

## 📝 Licencia

MIT

---

**Desarrollado como Proyecto Final del curso de Backend - CoderHouse**