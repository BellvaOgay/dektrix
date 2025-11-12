import fetch from 'node-fetch';

async function testHealth() {
    try {
        const baseUrl = 'https://dektrix-cquli3vck-bellvaogays-projects.vercel.app';
        
        console.log('Testing health endpoint on:', baseUrl);
        
        // Test a simple GET endpoint first
        const response = await fetch(`${baseUrl}/api/health`);
        const responseText = await response.text();
        
        console.log('Health endpoint status:', response.status);
        console.log('Health response:', responseText);
        
        // Test if we can get user credits
        console.log('\nTesting user credits endpoint...');
        const creditsResponse = await fetch(`${baseUrl}/api/users/0x742d35Cc6634C0532925a3b844Bc454e4438f44e/credits`);
        const creditsText = await creditsResponse.text();
        
        console.log('Credits endpoint status:', creditsResponse.status);
        console.log('Credits response:', creditsText);
        
    } catch (error) {
        console.error('❌ Health test failed with error:', error.message);
    }
}

testHealth();