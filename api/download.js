const axios = require('axios');

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, title } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Fetch video dengan streaming
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
            }
        });

        // Set headers untuk download
        const filename = title ? `${title}.mp4` : 'video.mp4';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
        
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        // Stream data ke client chunk per chunk
        response.data.pipe(res);

        // Handle errors in streaming
        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download failed' });
            }
        });

    } catch (error) {
        console.error('Download error:', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ 
                error: 'Failed to download file',
                details: error.message 
            });
        }
    }
};
