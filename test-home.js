import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';

async function testApi() {
  try {
    // Check home
    console.log('Testing Home API...');
    const homeRes = await axios.get(`${API_BASE_URL}/api/v1/users/home`);
    console.log('Home status:', homeRes.status);
    console.log('Home keys:', Object.keys(homeRes.data));
    console.log('Home data:', JSON.stringify(homeRes.data, null, 2));

  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    }
  }
}

testApi();
