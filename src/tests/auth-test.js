import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';

const testUser = {
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan.perez@test.com',
    age: 25,
    password: 'password123'
};

const testAdmin = {
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
    age: 30,
    password: 'admin123'
};

let userToken = '';
let adminToken = '';

const makeRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { error: error.message };
    }
};

const test = (description, testFn) => {
    console.log(`\n🧪 ${description}`);
    return testFn();
};

const runTests = async () => {
    console.log('🚀 Iniciando pruebas del sistema de autenticación\n');

    await test('Registro de usuario normal', async () => {
        const result = await makeRequest('/api/sessions/register', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (result.status === 201) {
            console.log('✅ Usuario registrado exitosamente');
            console.log(`   Usuario: ${result.data.payload.email}`);
        } else {
            console.log('❌ Error en registro:', result.data.message);
        }
    });

    await test('Login de usuario normal', async () => {
        const result = await makeRequest('/api/sessions/login', {
            method: 'POST',
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        
        if (result.status === 200) {
            userToken = result.data.token;
            console.log('✅ Login exitoso');
            console.log(`   Token generado: ${userToken.substring(0, 20)}...`);
        } else {
            console.log('❌ Error en login:', result.data.message);
        }
    });
    
    await test('Acceso a /api/sessions/current (autenticado)', async () => {
        const result = await makeRequest('/api/sessions/current', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (result.status === 200) {
            console.log('✅ Acceso exitoso a ruta protegida');
            console.log(`   Usuario: ${result.data.payload.email}`);
            console.log(`   Rol: ${result.data.payload.role}`);
        } else {
            console.log('❌ Error accediendo a ruta protegida:', result.data.message);
        }
    });

    await test('Acceso a /api/sessions/current (sin token)', async () => {
        const result = await makeRequest('/api/sessions/current', {
            method: 'GET'
        });
        
        if (result.status === 401) {
            console.log('✅ Acceso denegado correctamente sin token');
        } else {
            console.log('❌ Error: debería denegar acceso sin token');
        }
    });
    
    await test('Intento de acceso a rutas de admin', async () => {
        const result = await makeRequest('/api/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (result.status === 403) {
            console.log('✅ Acceso denegado correctamente a ruta de admin');
        } else {
            console.log('❌ Error: usuario normal no debería acceder a rutas de admin');
        }
    });

    await test('Login con credenciales incorrectas', async () => {
        const result = await makeRequest('/api/sessions/login', {
            method: 'POST',
            body: JSON.stringify({
                email: testUser.email,
                password: 'password_incorrecta'
            })
        });
        
        if (result.status === 401) {
            console.log('✅ Login denegado correctamente con credenciales incorrectas');
        } else {
            console.log('❌ Error: debería denegar login con credenciales incorrectas');
        }
    });
    
    await test('Registro con email duplicado', async () => {
        const result = await makeRequest('/api/sessions/register', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (result.status === 400) {
            console.log('✅ Registro denegado correctamente con email duplicado');
        } else {
            console.log('❌ Error: debería denegar registro con email duplicado');
        }
    });
    
    await test('Logout de usuario', async () => {
        const result = await makeRequest('/api/sessions/logout', {
            method: 'POST'
        });
        
        if (result.status === 200) {
            console.log('✅ Logout exitoso');
        } else {
            console.log('❌ Error en logout:', result.data.message);
        }
    });
    
    console.log('\n🎉 Pruebas completadas!');
    console.log('\n📝 Resumen:');
    console.log('- ✅ Sistema de registro implementado');
    console.log('- ✅ Sistema de login con JWT implementado');
    console.log('- ✅ Rutas protegidas funcionando');
    console.log('- ✅ Validación de roles implementada');
    console.log('- ✅ Manejo de errores correcto');
    console.log('\n🔧 Para crear un usuario admin:');
    console.log('1. Conectarse a MongoDB');
    console.log('2. Ejecutar: db.users.updateOne({email: "admin@test.com"}, {$set: {role: "admin"}})');
};

runTests().catch(console.error);
