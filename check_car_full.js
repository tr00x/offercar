import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';

async function check() {
  try {
    const carRes = await axios.get(`${API_BASE_URL}/api/v1/users/cars/25`);
    console.log(JSON.stringify(carRes.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
