const http = require('http');

// Configuration
const PORT = 3000;
const HOST = 'localhost';

function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body, headers: res.headers });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('🔥 Starting Smoke Tests...');
    let hasError = false;

    // 1. Health Check
    try {
        const health = await request('GET', '/api/health');
        if (health.statusCode === 200 && health.body.status === 'ok') {
            console.log('✅ Health Check: PASS');
        } else {
            console.error('❌ Health Check: FAIL', health);
            hasError = true;
        }
    } catch (e) {
        console.error('❌ Health Check: ERROR (Is server running?)', e.message);
        process.exit(1);
    }

    // 2. Login (Admin)
    let token = '';
    try {
        const login = await request('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        // Debug output if needed
        // console.log('Login Response:', JSON.stringify(login.body, null, 2));

        if (login.statusCode === 200 && login.body.success && login.body.data && login.body.data.accessToken) {
            console.log('✅ Admin Login: PASS');
            token = login.body.data.accessToken;
        } else {
            console.error('❌ Admin Login: FAIL', JSON.stringify(login.body, null, 2));
            hasError = true;
        }
    } catch (e) {
        console.error('❌ Admin Login: ERROR', e.message);
        hasError = true;
    }

    // 3. Get User Profile (Protected Route)
    if (token) {
        try {
            // Correct endpoint is /api/profile/me based on server.js and profileRoutes.js
            const profile = await request('GET', '/api/profile/me', null, {
                'Authorization': `Bearer ${token}`
            });
            if (profile.statusCode === 200 && profile.body.success) {
                console.log('✅ Get Profile: PASS');
            } else {
                console.error('❌ Get Profile: FAIL', JSON.stringify(profile.body, null, 2));
                hasError = true;
            }
        } catch (e) {
            console.error('❌ Get Profile: ERROR', e.message);
            hasError = true;
        }
    } else {
        console.log('⚠️ Skipping Profile Test due to Login Failure');
    }

    if (hasError) {
        console.log('\n💥 Smoke Tests FAILED');
        process.exit(1);
    } else {
        console.log('\n✨ All Smoke Tests PASSED');
        process.exit(0);
    }
}

// Check if server is up, if not wait 2s and try once more
const checkServer = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
    runTests();
}).on('error', () => {
    console.log('Waiting for server...');
    setTimeout(runTests, 2000);
});
