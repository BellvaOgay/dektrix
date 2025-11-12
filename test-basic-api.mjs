import fetch from 'node-fetch';

async function testBasicAPI() {
    try {
        const baseUrl = 'https://dektrix-bhq9jowt6-bellvaogays-projects.vercel.app';
        
        console.log('Testing basic API endpoints on:', baseUrl);
        
        // Test a simple GET request to see if any API routes work
        const response = await fetch(`${baseUrl}/api`);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('Response text:', text);
        
        if (response.status === 404) {
            console.log('❌ No API routes are working - this suggests the serverless functions are not being deployed');
        } else {
            console.log('✅ API routes are working');
        }
        
    } catch (error) {
        console.error('Error testing basic API:', error);
    }
}

testBasicAPI();