# Sistema de Autenticación y Gestión de Usuarios

## Resumen

Este proyecto implementa un sistema completo de autenticación y gestión de usuarios con las siguientes características:

- **CRUD de usuarios** completo con paginación
- **Sistema de autenticación JWT** con Passport.js
- **Protección de rutas privadas** por roles
- **Persistencia en MongoDB** usando Mongoose
- **Encriptación de contraseñas** con bcrypt
- **Estrategias Local y JWT** de Passport
- **Middleware de autorización** por roles específicos
- **Sistema de recuperación** de contraseña por email
- **Validaciones robustas** en todas las capas

## Endpoints Implementados

### Autenticación (`/api/sessions`)

| Método | Endpoint | Descripción | Protegida |
|--------|----------|-------------|-----------|
| POST | `/api/sessions/register` | Registro de usuarios | No |
| POST | `/api/sessions/login` | Inicio de sesión | No |
| GET | `/api/sessions/current` | Usuario autenticado | JWT |
| GET | `/api/sessions/profile` | Perfil del usuario | JWT |
| POST | `/api/sessions/logout` | Cerrar sesión | No |
| POST | `/api/sessions/forgot-password` | Recuperar contraseña | No |
| POST | `/api/sessions/reset-password` | Restablecer contraseña | Token |

### Gestión de Usuarios (`/api/users`) - Solo Admin

| Método | Endpoint | Descripción | Protegida |
|--------|----------|-------------|-----------|
| GET | `/api/users` | Listar usuarios (paginado) | Admin |
| GET | `/api/users/:uid` | Obtener usuario por ID | Admin |
| PUT | `/api/users/:uid` | Actualizar usuario | Admin |
| DELETE | `/api/users/:uid` | Eliminar usuario | Admin |

## Modelo de Usuario

```javascript
{
  first_name: String,           
  last_name: String,            
  email: {                      
    type: String,
    unique: true,
    required: true
  resetPasswordToken: String,      # Token para recuperación de contraseña
  resetPasswordExpires: Date,       # Expiración del token (1 hora)
  role: {                       
    type: String,
    enum: ['user', 'admin'],
    default: "user"
  }
}
```

## Ejemplos de Uso y Datos de Prueba

### 1. Registro de Usuario

```bash
POST /api/sessions/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan.perez@example.com",
  "age": 25,
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Usuario registrado correctamente",
  "payload": {
    "id": "648...",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "role": "user"
  }
}
```

### 2. Inicio de Sesión

```bash
POST /api/sessions/login
Content-Type: application/json

{
  "email": "juan.perez@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Login exitoso",
  "payload": {
    "id": "648...",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "role": "user",
    "cart": { ... }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Acceso a Ruta Protegida

```bash
GET /api/sessions/current
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# O usando cookies automáticamente
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Usuario autenticado",
  "payload": {
    "id": "648...",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "age": 25,
    "role": "user",
    "cart": { ... },
    "createdAt": "2025-06-28T20:41:28.604Z",
    "updatedAt": "2025-06-28T20:41:28.604Z"
  }
}
```

## 🔐 Estrategias de Autenticación

### 1. Local Strategy (Registro)
- Valida datos requeridos
- Verifica email único
- Encripta contraseña con bcrypt
- Crea carrito automáticamente
- Valida formato de email y edad

### 2. Local Strategy (Login)
- Busca usuario por email
- Compara contraseña con bcrypt
- Devuelve usuario autenticado

### 3. JWT Strategy
- Extrae token de cookies o headers
- Valida token con clave secreta
- Busca usuario en base de datos
- Permite acceso a rutas protegidas

## 🛡️ Seguridad Implementada

### Encriptación
- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ JWT firmado con clave secreta
- ✅ Cookies httpOnly para mayor seguridad

### Validaciones
- ✅ Formato de email válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Edad entre 0 y 120 años
- ✅ Campos requeridos
- ✅ Email único en base de datos

### Autorización
- ✅ Middleware de autenticación JWT
- ✅ Middleware de autorización por roles
- ✅ Protección de rutas admin
- ✅ Validación de propiedad de recursos

## 📁 Estructura de Archivos

```
src/
├── config/
│   ├── database.js           # Conexión MongoDB
│   └── passport.config.js    # Configuración Passport
├── middlewares/
│   └── auth.js              # Middlewares de autorización
├── models/
│   ├── user.model.js        # Modelo de Usuario
│   ├── product.model.js     # Modelo de Producto
│   └── cart.model.js        # Modelo de Carrito
├── routes/
│   ├── sessions.router.js   # Rutas de autenticación
│   ├── users.router.js      # CRUD de usuarios
│   ├── products.router.js   # Rutas de productos
│   └── cart.router.js       # Rutas de carritos
├── utils/
│   └── auth.js              # Utilidades de autenticación
└── tests/
    └── auth-test.js         # Pruebas del sistema
```

## 🧪 Pruebas

Para ejecutar las pruebas del sistema:

```bash
node src/tests/auth-test.js
```

### Pruebas Incluidas:
- ✅ Registro de usuario
- ✅ Login exitoso
- ✅ Acceso a rutas protegidas con token válido
- ✅ Denegación de acceso sin token
- ✅ Denegación de acceso con rol insuficiente
- ✅ Validación de credenciales incorrectas
- ✅ Prevención de emails duplicados
- ✅ Logout de usuario

## 🌍 Variables de Entorno

```bash
MONGO_URI=mongodb+srv://...
PORT=8080
JWT_SECRET=mi_clave_secreta_super_segura_para_jwt
```

## 🚀 Comandos Disponibles

```bash
npm start                    # 
npm run dev                  
node src/tests/auth-test.js  
```

## 👨‍💻 Crear Usuario Administrador

Por defecto, todos los usuarios se crean con rol "user". Para crear un administrador:

### Opción 1: MongoDB Compass/Shell
```javascript
db.users.updateOne(
  { email: "admin@example.com" }, 
  { $set: { role: "admin" } }
)
```

### Opción 2: Script Node.js
```javascript
import User from './src/models/user.model.js';
import connectDB from './src/config/database.js';

await connectDB();
await User.findOneAndUpdate(
  { email: "admin@example.com" }, 
  { role: "admin" }
);
```

## Datos de Prueba y Testing

### Usuarios de Prueba Sugeridos

#### Usuario Regular
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "usuario@test.com",
  "age": 25,
  "password": "password123"
}
```

#### Usuario Administrador
```json
{
  "first_name": "Admin",
  "last_name": "Sistema",
  "email": "admin@test.com",
  "age": 30,
  "password": "admin123"
}
```

### Productos de Prueba

```json
[
  {
    "title": "Smartphone Samsung Galaxy",
    "description": "Teléfono inteligente de última generación",
    "code": "PHONE001",
    "price": 599.99,
    "stock": 50,
    "category": "Electrónicos",
    "thumbnails": ["phone1.jpg", "phone2.jpg"]
  },
  {
    "title": "Laptop HP Pavilion",
    "description": "Laptop para trabajo y entretenimiento",
    "code": "LAPTOP001",
    "price": 799.99,
    "stock": 25,
    "category": "Computadoras",
    "thumbnails": ["laptop1.jpg"]
  },
  {
    "title": "Auriculares Sony WH-1000XM4",
    "description": "Auriculares con cancelación de ruido",
    "code": "AUDIO001",
    "price": 299.99,
    "stock": 75,
    "category": "Audio",
    "thumbnails": ["headphones1.jpg"]
  }
]
```

### Secuencia de Pruebas Recomendada

#### 1. Registro y Autenticación
```bash
# Registrar usuario regular
POST /api/sessions/register
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "usuario@test.com",
  "age": 25,
  "password": "password123"
}

# Iniciar sesión
POST /api/sessions/login
{
  "email": "usuario@test.com",
  "password": "password123"
}

# Verificar token JWT en respuesta y usarlo en header:
# Authorization: Bearer <token>
```

#### 2. Gestión de Productos (requiere admin)
```bash
# Crear producto
POST /api/products
Authorization: Bearer <admin_token>
{
  "title": "Producto Test",
  "description": "Descripción del producto",
  "code": "TEST001",
  "price": 99.99,
  "stock": 10,
  "category": "Test"
}

# Listar productos (público)
GET /api/products?page=1&limit=10
```

#### 3. Gestión de Carrito
```bash
# Crear carrito
POST /api/carts
Authorization: Bearer <user_token>

# Agregar producto al carrito
POST /api/carts/:cid/product/:pid
Authorization: Bearer <user_token>
{
  "quantity": 2
}

# Procesar compra
POST /api/carts/:cid/purchase
Authorization: Bearer <user_token>
```

#### 4. Recuperación de Contraseña
```bash
# Solicitar recuperación
POST /api/sessions/forgot-password
{
  "email": "usuario@test.com"
}

# Restablecer con token (del email)
POST /api/sessions/reset-password
{
  "token": "abc123def456",
  "newPassword": "nuevaPassword123"
}
```

### Variables de Entorno para Testing

```env
# Base de datos de testing
MONGO_URI=mongodb+srv://test:test@cluster.mongodb.net/ecommerce_test

# JWT para testing (cambiar en producción)
JWT_SECRET=test_jwt_secret_key_12345

# Email de testing (usar Gmail de prueba)
MAIL_USER=test.ecommerce@gmail.com
MAIL_PASSWORD=app_password_gmail
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Test específicos (si se implementan)
npm run test:auth
npm run test:products
npm run test:cart
```

### Herramientas de Testing Recomendadas

1. **Postman/Insomnia**: Para probar endpoints manualmente
2. **MongoDB Compass**: Para verificar datos en la base
3. **VS Code REST Client**: Con archivos `.http` para requests
4. **Node.js scripts**: Para poblar datos de prueba

### Colección Postman

Se recomienda crear una colección con:
- Variables de entorno para `baseURL` y `authToken`
- Requests pre-configurados para todos los endpoints
- Tests automáticos en cada request
- Workflows para casos de uso completos

---

**Nota**: Recuerda cambiar todas las credenciales y secretos antes de desplegar en producción.

