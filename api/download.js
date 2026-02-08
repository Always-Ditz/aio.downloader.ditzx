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
        const { url, title, ext } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Fetch file dengan streaming
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'
            }
        });

        // Detect content type and extension
        const contentType = response.headers['content-type'];
        let fileExt = ext || 'mp4';
        let mimeType = contentType || 'video/mp4';

        // Determine file extension based on content type if not provided
        if (!ext) {
            if (contentType) {
                if (contentType.includes('image')) {
                    fileExt = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 
                              contentType.includes('png') ? 'png' : 
                              contentType.includes('webp') ? 'webp' : 'jpg';
                } else if (contentType.includes('audio')) {
                    fileExt = contentType.includes('mpeg') ? 'mp3' : 'mp3';
                } else if (contentType.includes('video')) {
                    fileExt = 'mp4';
                }
            }
        }

        // Set headers untuk download
        const filename = title ? `${title}.${fileExt}` : `download.${fileExt}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', mimeType);
        
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
