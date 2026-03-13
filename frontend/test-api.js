// Simple test to check API connectivity
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function testAPI() {
    try {
        console.log('Testing API connection to:', API_URL);

        // Test health endpoint
        const healthResponse = await fetch(`${API_URL}/health`);
        console.log('Health endpoint:', healthResponse.status);

        // Test auth login endpoint (should return 422 for empty body)
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });
        console.log('Login endpoint:', loginResponse.status);

        if (loginResponse.status === 422) {
            console.log('✅ API endpoints are working correctly');
        } else {
            console.log('❌ Unexpected response from login endpoint');
        }

    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

testAPI();