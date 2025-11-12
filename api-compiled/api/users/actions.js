import connectDB from "../../src/lib/database.js";
export default async function handler(req, res) {
    try {
        const { slug } = req.query;
        const parts = Array.isArray(slug)
            ? slug
            : (typeof slug === 'string' ? slug.split(',') : []);
        const wallet = parts[0];
        const action = parts[1] || (req.method === 'GET' ? 'get-profile' : undefined);
        if (!wallet) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const mongoose = await connectDB();
        const db = mongoose.connection.db;
        switch (req.method) {
            case 'GET':
                // Handle different GET actions
                switch (action) {
                    case 'tip-balance':
                        return await getTipBalance(db, wallet, res);
                    case 'uploaded-videos':
                        return await getUploadedVideos(db, wallet, res);
                    case 'withdrawal-history':
                        return await getWithdrawalHistory(db, wallet, res);
                    default:
                        return await getUserProfile(db, wallet, res);
                }
            case 'POST':
                // Handle different POST actions
                switch (action) {
                    case 'add-credits':
                        return await addCredits(db, wallet, req, res);
                    case 'withdraw':
                        return await processWithdrawal(db, wallet, req, res);
                    case 'create':
                        return await createUser(db, wallet, req, res);
                    default:
                        return res.status(400).json({ error: 'Invalid action' });
                }
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    }
    catch (error) {
        console.error('User API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getUserProfile(db, wallet, res) {
    try {
        const user = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const viewCredits = (user.viewCredits ?? user.credits ?? 0);
        return res.status(200).json({ success: true, data: {
            _id: user._id,
            walletAddress: user.walletAddress,
            username: user.username,
            viewCredits,
            credits: viewCredits,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
        }});
    }
    catch (error) {
        console.error('Get user profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
}
async function getTipBalance(db, wallet, res) {
    try {
        const user = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({
            tipBalance: user.tipBalance || 0,
            totalTipsReceived: user.totalTipsReceived || 0
        });
    }
    catch (error) {
        console.error('Get tip balance error:', error);
        return res.status(500).json({ error: 'Failed to fetch tip balance' });
    }
}
async function getUploadedVideos(db, wallet, res) {
    try {
        const videos = await db.collection('videos').find({
            creatorWallet: wallet.toLowerCase()
        }).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(videos);
    }
    catch (error) {
        console.error('Get uploaded videos error:', error);
        return res.status(500).json({ error: 'Failed to fetch uploaded videos' });
    }
}
async function getWithdrawalHistory(db, wallet, res) {
    try {
        const withdrawals = await db.collection('withdrawalHistory').find({
            walletAddress: wallet.toLowerCase()
        }).sort({ createdAt: -1 }).limit(50).toArray();
        return res.status(200).json(withdrawals);
    }
    catch (error) {
        console.error('Get withdrawal history error:', error);
        return res.status(500).json({ error: 'Failed to fetch withdrawal history' });
    }
}
async function addCredits(db, wallet, req, res) {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const result = await db.collection('users').updateOne({ walletAddress: wallet.toLowerCase() }, {
            $inc: { credits: amount, viewCredits: amount },
            $set: { lastLoginAt: new Date() }
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updated = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() }, { projection: { _id: 1, username: 1, walletAddress: 1, credits: 1, viewCredits: 1 } });
        const viewCredits = (updated.viewCredits ?? updated.credits ?? 0);
        return res.status(200).json({ success: true, data: { viewCredits, creditsAdded: amount, user: { _id: updated._id, username: updated.username, walletAddress: updated.walletAddress } } });
    }
    catch (error) {
        console.error('Add credits error:', error);
        return res.status(500).json({ error: 'Failed to add credits' });
    }
}
async function processWithdrawal(db, wallet, req, res) {
    try {
        const { amount, recipientAddress } = req.body;
        if (!amount || amount < 5) {
            return res.status(400).json({ error: 'Minimum withdrawal is 5 USDC' });
        }
        const user = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.tipBalance < amount) {
            return res.status(400).json({ error: 'Insufficient tip balance' });
        }
        // Deduct from user balance
        await db.collection('users').updateOne({ walletAddress: wallet.toLowerCase() }, { $inc: { tipBalance: -amount } });
        // Record withdrawal
        const withdrawal = {
            walletAddress: wallet.toLowerCase(),
            amount,
            recipientAddress: recipientAddress || wallet.toLowerCase(),
            status: 'pending',
            createdAt: new Date()
        };
        const result = await db.collection('withdrawalHistory').insertOne(withdrawal);
        return res.status(200).json({ success: true, withdrawalId: result.insertedId });
    }
    catch (error) {
        console.error('Process withdrawal error:', error);
        return res.status(500).json({ error: 'Failed to process withdrawal' });
    }
}
async function createUser(db, wallet, req, res) {
    try {
        const existingUser = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
        if (existingUser) {
            return res.status(200).json({ success: true, data: existingUser, isNewUser: false });
        }
        const now = new Date();
        const newUser = {
            walletAddress: wallet.toLowerCase(),
            username: `user_${wallet.slice(-8)}`,
            credits: 1,
            viewCredits: 1,
            tipBalance: 0,
            totalTipsReceived: 0,
            createdAt: now,
            lastLoginAt: now,
            isActive: true
        };
        const result = await db.collection('users').insertOne(newUser);
        newUser._id = result.insertedId;
        return res.status(201).json({ success: true, data: newUser, isNewUser: true });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
}
