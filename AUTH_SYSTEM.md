# 🔐 Sistema de Autenticación y Gestión de Usuarios

## 📋 Resumen

Este proyecto implementa un sistema completo de autenticación y gestión de usuarios con las siguientes características:

- ✅ **CRUD de usuarios** completo
- ✅ **Sistema de autenticación JWT** con Passport.js
- ✅ **Protección de rutas privadas**
- ✅ **Persistencia en MongoDB** usando Mongoose
- ✅ **Encriptación de contraseñas** con bcrypt
- ✅ **Estrategias Local y JWT** de Passport
- ✅ **Middleware de autorización** por roles
- ✅ **Validaciones robustas**

## 🚀 Endpoints Implementados

### 🔐 Autenticación (`/api/sessions`)

| Método | Endpoint | Descripción | Protegida |
|--------|----------|-------------|-----------|
| POST | `/api/sessions/register` | Registro de usuarios | ❌ |
| POST | `/api/sessions/login` | Inicio de sesión | ❌ |
| GET | `/api/sessions/current` | Usuario autenticado | ✅ JWT |
| GET | `/api/sessions/profile` | Perfil del usuario | ✅ JWT |
| POST | `/api/sessions/logout` | Cerrar sesión | ❌ |

### 👥 Gestión de Usuarios (`/api/users`) - Solo Admin

| Método | Endpoint | Descripción | Protegida |
|--------|----------|-------------|-----------|
| GET | `/api/users` | Listar usuarios (paginado) | ✅ Admin |
| GET | `/api/users/:uid` | Obtener usuario por ID | ✅ Admin |
| PUT | `/api/users/:uid` | Actualizar usuario | ✅ Admin |
| DELETE | `/api/users/:uid` | Eliminar usuario | ✅ Admin |

## 📊 Modelo de Usuario

```javascript
{
  first_name: String,           
  last_name: String,            
  email: {                      
    type: String,
    unique: true,
    required: true
  },
  age: Number,                 
  password: String,            
  cart: {                      
    type: ObjectId,
    ref: "Cart"
  },
  role: {                       
    type: String,
    enum: ['user', 'admin'],
    default: "user"
  }
}
```

## 🔧 Ejemplos de Uso

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

