const axios = require('axios');

class DownrScraper {
    constructor() {
        this.baseURL = 'https://downr.org';
        this.headers = {
            'authority': 'downr.org',
            'accept': '*/*',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://downr.org',
            'referer': 'https://downr.org/',
            'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
            'accept-encoding': 'gzip, deflate, br, zstd'
        };
    }

    async getSessionCookie() {
        const cookies = '_ga=GA1.1.536005378.1770437315; _clck=17lj13q%5E2%5Eg3d%5E0%5E2229; _ga_2HS60D2GS7=GS2.1.s1770437315$o1$g1$t1770437481$j60$l0$h0; _clsk=1yaus0r%5E1770437888260%5E3%5E1%5Ed.clarity.ms%2Fcollect';
        
        const headers = {
            ...this.headers,
            'cookie': cookies
        };

        try {
            const response = await axios.get(`${this.baseURL}/.netlify/functions/analytics`, { headers });
            
            const setCookie = response.headers['set-cookie'][0];
            const sessCookie = setCookie.split(';')[0];
            
            return `${cookies}; ${sessCookie}`;
        } catch (error) {
            return cookies;
        }
    }

    async getVideoInfo(url) {
        const cookie = await this.getSessionCookie();
        
        const headers = {
            ...this.headers,
            'cookie': cookie
        };

        const payload = {
            url: url
        };

        const response = await axios.post(`${this.baseURL}/.netlify/functions/nyt`, payload, { headers });
        
        return {
            url: response.data.url,
            title: response.data.title,
            author: response.data.author,
            duration: response.data.duration,
            thumbnail: response.data.thumbnail,
            medias: response.data.medias
        };
    }
}

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

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const scraper = new DownrScraper();
        const result = await scraper.getVideoInfo(url);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ 
            error: 'Failed to process URL',
            details: error.message 
        });
    }
};