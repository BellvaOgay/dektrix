import fetch from 'node-fetch';

async function testCreditPurchase() {
    try {
        // Test the most recent deployment URL
        const baseUrl = 'https://dektrix-bhq9jowt6-bellvaogays-projects.vercel.app';
        const walletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
        const amount = 10;
        
        console.log('Testing credit purchase on:', baseUrl);
        console.log('Wallet:', walletAddress);
        console.log('Amount:', amount);
        
        // Use the correct serverless function endpoint format
        const response = await fetch(`${baseUrl}/api/users/${walletAddress}/actions?action=add-credits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        });
        
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        console.log('Response text:', responseText);
        
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
            console.log(`Result:`, result);
        } else {
            console.log('❌ Credit purchase test FAILED!');
            console.log('Error:', result.error || result.message || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testCreditPurchase();