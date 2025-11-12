import connectDB from "../src/lib/database.js";
function send(res, status, data) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}
export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }
    try {
        await connectDB();
    }
    catch (err) {
        console.error('Database connection error:', err);
        return send(res, 500, { success: false, error: 'Database connection failed' });
    }
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET') {
        // Parse query params
        const url = new URL(req.url || '', 'http://localhost');
        const category = url.searchParams.get('category') || undefined;
        const featuredParam = url.searchParams.get('featured');
        const featured = featuredParam === undefined ? undefined : featuredParam === 'true';
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const skip = parseInt(url.searchParams.get('skip') || '0', 10);
        const episode = url.searchParams.get('episode');
        if (episode === 'ep5' || episode === 'ep6') {
            try {
                const mongoose = await connectDB();
                const db = mongoose.connection.db;
                const episodeVideo = await db.collection('videos').findOne({
                    $or: [
                        { title: { $regex: new RegExp(episode, 'i') } },
                        { filename: { $regex: new RegExp(`${episode}\\.mp4$`, 'i') } }
                    ],
                    isActive: { $in: [true, undefined] }
                });
                if (!episodeVideo) {
                    return send(res, 404, { success: false, error: `${episode.toUpperCase()} video not found` });
                }
                const response = {
                    _id: episodeVideo._id,
                    title: episodeVideo.title,
                    description: episodeVideo.description || `${episode.toUpperCase()} - Premium content`,
                    videoUrl: episodeVideo.videoUrl,
                    filename: episodeVideo.filename || `${episode}.mp4`,
                    thumbnail: episodeVideo.thumbnail || '/placeholder.svg',
                    duration: episodeVideo.duration || 0,
                    category: episodeVideo.category || 'Entertainment',
                    price: episodeVideo.price || 100000,
                    priceDisplay: episodeVideo.priceDisplay || '0.1 USDC',
                    isFree: episodeVideo.isFree || false,
                    isUnlocked: episodeVideo.isUnlocked || false,
                    totalViews: episodeVideo.totalViews || 0,
                    totalUnlocks: episodeVideo.totalUnlocks || 0,
                    createdAt: episodeVideo.createdAt,
                    creator: episodeVideo.creator || null,
                    shouldBeLocked: !episodeVideo.isFree && (episodeVideo.price > 0),
                    [`is${episode.toUpperCase()}`]: true
                };
                return send(res, 200, { success: true, data: response });
            }
            catch (error) {
                console.error(`Error fetching ${episode} video:`, error);
                return send(res, 500, { success: false, error: `Failed to fetch ${episode} video` });
            }
        }
        // Regular video listing
        const query = { isActive: { $in: [true, undefined] } };
        if (category)
            query.category = category;
        if (featured !== undefined)
            query.featured = featured;
        try {
            const mongoose = await connectDB();
            const db = mongoose.connection.db;
            const videos = await db.collection('videos')
                .find(query)
                .sort({ featured: -1, createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .toArray();
            return send(res, 200, { success: true, data: videos });
        }
        catch (error) {
            console.error('Error fetching videos:', error);
            return send(res, 500, { success: false, error: 'Failed to fetch videos' });
        }
    }
    if (method === 'POST') {
        // Collect body
        let bodyData = '';
        req.on('data', (chunk) => { bodyData += chunk; });
        req.on('end', async () => {
            try {
                const data = bodyData ? JSON.parse(bodyData) : {};
                // Basic validation
                if (!data.title || !data.description || !data.videoUrl || !data.thumbnail || !data.duration || !data.category || data.price === undefined || !data.priceDisplay || !data.creatorWallet) {
                    return send(res, 400, { success: false, error: 'Missing required fields' });
                }
                // Ensure creator exists (create if absent)
                let creator = await Creator.findOne({ wallet_address: data.creatorWallet.toLowerCase() });
                if (!creator) {
                    creator = new Creator({
                        wallet_address: data.creatorWallet.toLowerCase(),
                        username: data.creatorWallet.slice(0, 8),
                    });
                    await creator.save();
                }
                const video = new Video({
                    title: data.title,
                    description: data.description,
                    thumbnail: data.thumbnail,
                    videoUrl: data.videoUrl,
                    duration: data.duration,
                    category: data.category,
                    tags: data.tags || [],
                    price: data.price,
                    priceDisplay: data.priceDisplay,
                    difficulty: data.difficulty || 'Beginner',
                    creator: creator._id,
                    totalViews: 0,
                    totalUnlocks: 0,
                    totalTipsEarned: 0,
                    isActive: true,
                    featured: !!data.featured,
                    isFree: !!data.isFree,
                });
                await video.save();
                return send(res, 201, { success: true, data: video });
            }
            catch (error) {
                console.error('Error creating video:', error);
                return send(res, 500, { success: false, error: 'Failed to create video' });
            }
        });
        return;
    }
    // Method not allowed
    res.setHeader('Allow', 'GET,POST');
    return send(res, 405, { success: false, error: 'Method Not Allowed' });
}
