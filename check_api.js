
import axios from 'axios';

async function checkApi() {
  try {
    const response = await axios.get('https://api.mashynbazar.com/api/v1/users/home');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data is array:', Array.isArray(response.data));
    console.log('Data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
    if (!Array.isArray(response.data)) {
        console.log('Data keys:', Object.keys(response.data));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkApi();
