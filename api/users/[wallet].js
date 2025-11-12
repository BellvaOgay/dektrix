import connectDB from "../../src/lib/database.js";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { wallet } = req.query;
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // align with local server: return full user doc sans internal fields
    const { __v, ...safe } = user;
    return res.status(200).json({ success: true, data: safe });
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

