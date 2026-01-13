import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const API_BASE_URL = 'https://api.mashynbazar.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzE3NzMzNzAsImlkIjozNTMsInJvbGVfaWQiOjF9.Tha6Cnx6gPZFddbxXdsVYUmmhQ8SMEbC92XYNN5hSoM';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function createDummyImage() {
    // 1x1 transparent PNG
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const buffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync('dummy.png', buffer);
    console.log('Dummy image created: dummy.png');
}

async function main() {
  try {
    await createDummyImage();

    console.log('Fetching brands...');
    const brandsRes = await apiClient.get('/api/v1/users/brands');
    const brands = brandsRes.data;
    if (!brands.length) throw new Error('No brands found');
    
    // Pick Toyota
    const brand = brands.find(b => b.name === 'Toyota') || brands[0];
    console.log(`Selected Brand: ${brand.name} (ID: ${brand.id})`);

    console.log(`Fetching models for brand ${brand.id}...`);
    const modelsRes = await apiClient.get(`/api/v1/users/brands/${brand.id}/models`);
    const models = modelsRes.data;
    if (!models.length) throw new Error('No models found');
    
    // Pick Camry
    const model = models.find(m => m.name === 'Camry') || models[0];
    console.log(`Selected Model: ${model.name} (ID: ${model.id})`);

    console.log(`Fetching generations for model ${model.id}...`);
    const genRes = await apiClient.get('/api/v1/users/models/generations', { 
        params: { models: model.id } 
    });
    const generations = genRes.data;
    
    if (!generations.length) {
        console.log('No generations found via /api/v1/users/models/generations');
        throw new Error('No generations found');
    }
    
    const generation = generations[0]; 
    console.log(`Selected Generation: ${generation.name} (ID: ${generation.id})`);
    
    let modification = null;
    if (generation.modifications && generation.modifications.length > 0) {
        modification = generation.modifications[0];
    }

    if (!modification) {
         console.log('Could not find modification. Cannot proceed cleanly.');
         return;
    }
    console.log(`Selected Modification: ${modification.name} (ID: ${modification.id})`);

    console.log('Fetching cities...');
    const citiesRes = await apiClient.get('/api/v1/users/cities');
    const city = citiesRes.data[0];
    console.log(`Selected City: ${city.name} (ID: ${city.id})`);

    console.log('Fetching colors...');
    const colorsRes = await apiClient.get('/api/v1/users/colors');
    const color = colorsRes.data[0];
    console.log(`Selected Color: ${color.name} (ID: ${color.id})`);

    // Create Cars loop
    for (let i = 0; i < 3; i++) {
        const carData = {
        brand_id: brand.id,
        model_id: model.id,
        modification_id: modification.id,
        city_id: city.id,
        color_id: color.id,
        year: 2020 + i, // different years
        price: 25000 + (i * 1000),
        odometer: 15000 + (i * 5000),
        phone_numbers: ['+99365123456'],
        trade_in: 1, // Set to 1
        vin_code: `DUMMYVIN1234567${i}`,
        wheel: true, 
        crash: false,
        new: false,
        owners: 1,
        description: `Demo car ${i+1} created via script. Excellent condition!`
        };

        console.log(`Creating car ${i+1}...`, carData);
        const createRes = await apiClient.post('/api/v1/users/cars', carData);
        const newCar = createRes.data;
        console.log('Car created!', newCar);
        
        // Handle response format
        const carId = newCar.id || newCar.car_id || (newCar.data && newCar.data.id);
        
        if (carId) {
            console.log(`Uploading image for car ${carId}...`);
            
            const form = new FormData();
            form.append('images', fs.createReadStream('dummy.png'));
            
            const uploadRes = await axios.post(`${API_BASE_URL}/api/v1/users/cars/${carId}/images`, form, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    ...form.getHeaders()
                }
            });
            console.log('Image uploaded!', uploadRes.data);
        } else {
            console.log('Could not determine new car ID from response:', newCar);
        }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    }
  }
}

main();
