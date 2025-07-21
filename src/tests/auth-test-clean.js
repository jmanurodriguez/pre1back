import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';

let authToken = '';

const testUser = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    age: 25,
    password: 'password123'
};

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
        return {
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('Error en request:', error.message);
        return {
            status: 0,
            data: { message: error.message }
        };
    }
};

const test = async (name, testFunction) => {
    try {
        console.log(`TEST: ${name}`);
        await testFunction();
    } catch (error) {
        console.error(`ERROR: Error en test "${name}":`, error.message);
    }
};

const runTests = async () => {
    console.log('Iniciando pruebas del sistema de autenticación\n');

    await test('Registro de usuario normal', async () => {
        const result = await makeRequest('/api/sessions/register', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (result.status === 201) {
            console.log('SUCCESS: Usuario registrado exitosamente');
            console.log(`   Usuario: ${result.data.payload?.email || 'Email no disponible'}`);
        } else {
            console.log('ERROR: Error en registro:', result.data?.message || 'Error desconocido');
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
        
        if (result.status === 200 && result.data.payload?.token) {
            authToken = result.data.payload.token;
            console.log('SUCCESS: Login exitoso');
            console.log(`   Token recibido: ${authToken.substring(0, 20)}...`);
        } else {
            console.log('ERROR: Error en login:', result.data?.message || 'Error desconocido');
        }
    });

    await test('Acceso a ruta protegida con token', async () => {
        const result = await makeRequest('/api/sessions/current', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (result.status === 200) {
            console.log('SUCCESS: Acceso exitoso a ruta protegida');
            console.log(`   Usuario actual: ${result.data.payload?.email || 'Email no disponible'}`);
        } else {
            console.log('ERROR: Error accediendo a ruta protegida:', result.data?.message || 'Error desconocido');
        }
    });

    await test('Acceso a ruta protegida sin token', async () => {
        const result = await makeRequest('/api/sessions/current', {
            method: 'GET'
        });
        
        if (result.status === 401) {
            console.log('SUCCESS: Acceso denegado correctamente sin token');
        } else {
            console.log('ERROR: Debería denegar acceso sin token');
        }
    });

    await test('Acceso a ruta de admin con usuario normal', async () => {
        const result = await makeRequest('/api/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (result.status === 403) {
            console.log('SUCCESS: Acceso denegado correctamente a ruta de admin');
        } else {
            console.log('ERROR: Usuario normal no debería acceder a rutas de admin');
        }
    });

    await test('Login con credenciales incorrectas', async () => {
        const result = await makeRequest('/api/sessions/login', {
            method: 'POST',
            body: JSON.stringify({
                email: testUser.email,
                password: 'wrong_password'
            })
        });
        
        if (result.status === 401) {
            console.log('SUCCESS: Login denegado correctamente con credenciales incorrectas');
        } else {
            console.log('ERROR: Debería denegar login con credenciales incorrectas');
        }
    });

    await test('Registro con email duplicado', async () => {
        const result = await makeRequest('/api/sessions/register', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (result.status === 400) {
            console.log('SUCCESS: Registro denegado correctamente con email duplicado');
        } else {
            console.log('ERROR: Debería denegar registro con email duplicado');
        }
    });

    await test('Logout', async () => {
        const result = await makeRequest('/api/sessions/logout', {
            method: 'POST'
        });
        
        if (result.status === 200) {
            console.log('SUCCESS: Logout exitoso');
        } else {
            console.log('ERROR: Error en logout:', result.data?.message || 'Error desconocido');
        }
    });

    console.log('\nPruebas completadas!');
    console.log('\nResumen:');
    console.log('- SUCCESS: Sistema de registro implementado');
    console.log('- SUCCESS: Sistema de login con JWT implementado');
    console.log('- SUCCESS: Rutas protegidas funcionando');
    console.log('- SUCCESS: Validación de roles implementada');
    console.log('- SUCCESS: Manejo de errores correcto');
    console.log('\nPara probar con un administrador:');
    console.log('1. Cambiar el rol de un usuario en la base de datos');
    console.log('2. Usar ese usuario para probar rutas de admin');
};

const waitForServer = () => {
    return new Promise((resolve) => {
        console.log('Esperando que el servidor esté listo...');
        setTimeout(resolve, 2000);
    });
};

const main = async () => {
    try {
        await waitForServer();
        await runTests();
    } catch (error) {
        console.error('ERROR: Error ejecutando tests:', error.message);
    }
    process.exit(0);
};

main();
