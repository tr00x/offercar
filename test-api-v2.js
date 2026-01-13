import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';

async function testApi() {
  try {
    // Check cars
    console.log('Testing Cars API...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/users/cars`);
    const cars = response.data;
    if (Array.isArray(cars)) {
        console.log(`Found ${cars.length} cars.`);
        for (const car of cars.slice(0, 3)) {
            console.log(`Car ${car.id} images:`, car.images);
            if (car.images && car.images.length > 0) {
                const url = car.images[0];
                try {
                    const imgRes = await axios.head(url);
                    console.log(`  Image ${url} -> ${imgRes.status}`);
                } catch (e) {
                    console.log(`  Image ${url} -> Error: ${e.response ? e.response.status : e.message}`);
                }
            }
        }
    }

    // Check home
    console.log('\nTesting Home API...');
    const homeRes = await axios.get(`${API_BASE_URL}/api/v1/users/home`);
    const homeData = homeRes.data;
    if (homeData.recent_cars) {
         console.log(`Found ${homeData.recent_cars.length} recent cars.`);
         if (homeData.recent_cars.length > 0) {
             const car = homeData.recent_cars[0];
             console.log(`Recent Car ${car.id} images:`, car.images);
         }
    }

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testApi();
