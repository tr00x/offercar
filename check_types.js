import axios from 'axios';

const API_BASE_URL = 'https://api.mashynbazar.com';

async function check() {
  try {
    // 1. Check Brands type
    const brandsRes = await axios.get(`${API_BASE_URL}/api/v1/users/brands`);
    const firstBrand = brandsRes.data[0];
    console.log('Brand ID type:', typeof firstBrand.id, firstBrand.id);

    // 2. Check Car 25 (if exists)
    try {
      const carRes = await axios.get(`${API_BASE_URL}/api/v1/users/cars/25`);
      const car = carRes.data;
      console.log('Car 25 found:');
      console.log('  Brand ID type:', typeof car.brand.id, car.brand.id);
      console.log('  Model ID type:', typeof car.model.id, car.model.id);
      console.log('  Year type:', typeof car.year, car.year);
    } catch (e) {
      console.log('Car 25 not found or public endpoint different');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
