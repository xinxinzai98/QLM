const http = require('http');

const PORT = 3000;
const HOST = 'localhost';

// Helper to make HTTP requests
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
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runIntegrationTest() {
    console.log('🚀 Starting Integration Tests...');
    let token = '';
    let materialId = null;
    let transactionId = null;
    let hasError = false;

    // 1. Login as Admin
    console.log('\n--- Step 1: Admin Login ---');
    try {
        const res = await request('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        if (res.statusCode === 200 && res.body.success) {
            token = res.body.data.accessToken;
            console.log('✅ Login Successful');
        } else {
            throw new Error(`Login Failed: ${JSON.stringify(res.body)}`);
        }
    } catch (e) {
        console.error('❌ Step 1 Failed:', e.message);
        process.exit(1);
    }

    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Create Material
    console.log('\n--- Step 2: Create Material ---');
    const materialCode = `MAT_${Date.now()}`;
    try {
        const res = await request('POST', '/api/materials', {
            materialCode: materialCode,
            materialName: 'Test Chemical A',
            category: 'chemical',
            unit: 'kg',
            minStock: 10,
            maxStock: 100,
            description: 'Integration Test Material'
        }, authHeaders);

        if (res.statusCode === 201 && res.body.success) {
            materialId = res.body.data.id;
            console.log(`✅ Material Created (ID: ${materialId})`);
        } else {
            throw new Error(`Create Material Failed: ${JSON.stringify(res.body)}`);
        }
    } catch (e) {
        console.error('❌ Step 2 Failed:', e.message);
        hasError = true;
    }

    if (!materialId) {
        console.log('Skipping remaining tests due to material creation failure.');
        process.exit(1);
    }

    // 3. Create Inventory "In" Transaction
    console.log('\n--- Step 3: Create Inventory In Transaction ---');
    try {
        const res = await request('POST', '/api/inventory', {
            transactionType: 'in',
            materialId: materialId,
            quantity: 50,
            unitPrice: 10.5,
            remark: 'Test Inbound'
        }, authHeaders);

        if (res.statusCode === 201 && res.body.success) {
            transactionId = res.body.data.id;
            console.log(`✅ Transaction Created (ID: ${transactionId})`);
        } else {
            throw new Error(`Create Transaction Failed: ${JSON.stringify(res.body)}`);
        }
    } catch (e) {
        console.error('❌ Step 3 Failed:', e.message);
        hasError = true;
    }

    // 4. Approve Transaction
    if (transactionId) {
        console.log('\n--- Step 4: Approve Transaction ---');
        try {
            const res = await request('PUT', `/api/inventory/${transactionId}/approve`, {
                action: 'approve',
                remark: 'Approved by Test'
            }, authHeaders);

            if (res.statusCode === 200 && res.body.success) {
                console.log('✅ Transaction Approved');
            } else {
                throw new Error(`Approve Transaction Failed: ${JSON.stringify(res.body)}`);
            }
        } catch (e) {
            console.error('❌ Step 4 Failed:', e.message);
            hasError = true;
        }
    }

    // 5. Verify Stock
    console.log('\n--- Step 5: Verify Stock ---');
    try {
        const res = await request('GET', `/api/materials/${materialId}`, null, authHeaders);
        if (res.statusCode === 200 && res.body.success) {
            const stock = res.body.data.current_stock;
            if (stock === 50) {
                console.log(`✅ Stock Verified: ${stock}`);
            } else {
                throw new Error(`Stock Mismatch: Expected 50, got ${stock}`);
            }
        } else {
            throw new Error(`Get Material Failed: ${JSON.stringify(res.body)}`);
        }
    } catch (e) {
        console.error('❌ Step 5 Failed:', e.message);
        hasError = true;
    }

    if (hasError) {
        console.log('\n💥 Integration Tests FAILED');
        process.exit(1);
    } else {
        console.log('\n✨ All Integration Tests PASSED');
        process.exit(0);
    }
}

// Wait for server to be ready
const checkServer = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
    runIntegrationTest();
}).on('error', () => {
    console.log('Waiting for server...');
    setTimeout(runIntegrationTest, 2000);
});
