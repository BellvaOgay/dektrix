import fetch from 'node-fetch';

async function testCreditPurchase() {
    try {
        // Test the most recent deployment URL
        const baseUrl = 'https://dektrix-cquli3vck-bellvaogays-projects.vercel.app';
        
        console.log('Testing credit purchase on:', baseUrl);
        
        // Test data - use a test wallet address
        const testData = {
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Test wallet
            amount: 10 // 10 credits as requested
        };
        
        console.log('Sending credit purchase request:', testData);
        
        const response = await fetch(`${baseUrl}/api/users/add-credits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        console.log('Response text (first 200 chars):', responseText.substring(0, 200));
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Parsed JSON response:', result);
        } catch (e) {
            console.log('Response is not JSON:', responseText);
            result = { error: 'Non-JSON response' };
        }
        
        if (response.ok) {
            console.log('✅ Credit purchase test PASSED!');
            console.log(`New credit balance: ${result.newBalance}`);
        } else {
            console.log('❌ Credit purchase test FAILED!');
            console.log('Error:', result.message || result.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testCreditPurchase();