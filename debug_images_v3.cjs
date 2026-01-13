
const axios = require('axios');

const TARGET_URL = 'https://api.mashynbazar.com/api/v1/images/cars/22/3e63a71c-5da7-4503-817e-d2d71fd9bda5';
const BASE_DOMAIN = 'https://api.mashynbazar.com';

async function testUrl(url, description) {
    try {
        const httpsAgent = new (require('https').Agent)({  
            rejectUnauthorized: false
        });
        const response = await axios.get(url, {
            httpsAgent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            validateStatus: () => true // Don't throw on 404
        });
        console.log(`[${response.status}] ${description}: ${url}`);
        if (response.status === 200) {
            console.log('Content-Type:', response.headers['content-type']);
            console.log('Content-Length:', response.headers['content-length']);
        }
        return response.status === 200;
    } catch (e) {
        console.log(`[ERR] ${description}: ${url} - ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('Starting image URL diagnostics (GET, No-SSL-Verify)...');

    // 1. Original
    await testUrl(TARGET_URL, 'Original');

    // 7. Try base domain without api subdomain
    // mashynbazar.com/api/v1/images/...
    const mainDomainApi = TARGET_URL.replace('api.mashynbazar.com', 'mashynbazar.com');
    await testUrl(mainDomainApi, 'Main domain API');
    
    // 8. Main domain storage
    const mainDomainStorage = TARGET_URL.replace('api.mashynbazar.com/api/v1/images', 'mashynbazar.com/storage');
    await testUrl(mainDomainStorage, 'Main domain Storage');
    
    // 9. IP address? (Can't know it easily without lookup, skip)
}

main();
