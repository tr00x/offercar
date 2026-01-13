import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzE3NzMzNzAsImlkIjozNTMsInJvbGVfaWQiOjF9.Tha6Cnx6gPZFddbxXdsVYUmmhQ8SMEbC92XYNN5hSoM';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function main() {
  try {
    console.log('Fetching cars...');
    const res = await apiClient.get('/api/v1/users/cars?limit=10&page=1');
    console.log('Response keys:', Object.keys(res.data));
    const cars = Array.isArray(res.data) ? res.data : (res.data.data || res.data.cars || []);
    
    console.log(`Found ${cars.length} cars.`);
    
    cars.forEach(car => {
        console.log(`Car ID: ${car.id}, Model: ${car.model}, Images:`, car.images);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
        console.error('Response data:', error.response.data);
    }
  }
}

main();
