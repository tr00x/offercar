import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';

async function testApi() {
  try {
    console.log('Testing API connection...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/users/cars`);
    console.log('Status:', response.status);
    
    const data = response.data;
    if (Array.isArray(data)) {
        console.log('Cars found:', data.length);
        if (data.length > 0) {
            const firstCar = data[0];
            console.log('First car images:', firstCar.images);
            if (firstCar.images && firstCar.images.length > 0) {
                console.log('Image URL example:', firstCar.images[0]);
            }
        }
    } else {
        console.log('Data is not an array:', data);
    }
    
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    }
  }
}

testApi();
