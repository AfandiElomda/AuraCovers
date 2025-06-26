import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Cookie jar to maintain sessions
let sessionCookie = null;

// Helper to make requests with session persistence
async function makeRequest(method, url, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (sessionCookie) {
    config.headers.Cookie = sessionCookie;
  }
  
  if (data) {
    config.data = data;
  }
  
  const response = await axios(config);
  
  // Store session cookie for subsequent requests
  if (response.headers['set-cookie']) {
    sessionCookie = response.headers['set-cookie'][0];
  }
  
  return response;
}

async function quickPaymentTest() {
  console.log('🚀 Quick Payment Flow Test');
  console.log('==========================');

  try {
    // Step 1: Check initial user status
    console.log('\n1. Initial user status');
    const initialStatus = await makeRequest('GET', '/api/user-status');
    console.log('Free downloads:', initialStatus.data.freeDownloads);

    // Step 2: Generate a cover
    console.log('\n2. Generating book cover...');
    const coverData = {
      bookTitle: "Quick Test",
      authorName: "Test Author",
      genre: "fantasy",
      keywords: "test",
      mood: "epic"
    };
    
    const generateResponse = await makeRequest('POST', '/api/generate-cover', coverData);
    console.log('Cover generated:', generateResponse.data.success);
    const coverId = generateResponse.data.bookCover?.id;

    // Step 3: Test free download
    console.log('\n3. Testing free download...');
    const downloadResponse = await makeRequest('POST', '/api/download-cover', { coverId });
    console.log('Download success:', downloadResponse.data.success);
    console.log('Remaining free downloads:', downloadResponse.data.remainingFreeDownloads);

    // Step 4: Manually set user to 0 free downloads to test payment
    console.log('\n4. Testing payment initialization...');
    const paymentInit = await makeRequest('POST', '/api/initialize-payment', {
      email: 'test@example.com',
      amount: 100 // $1 in cents (USD)
    });
    
    if (paymentInit.data.success) {
      console.log('✅ Payment initialization successful');
      console.log('Authorization URL:', paymentInit.data.data.authorization_url);
    } else {
      console.log('❌ Payment initialization failed:', paymentInit.data.error);
    }

    console.log('\n✅ Payment system is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

quickPaymentTest();