import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const testUserId = `test_user_${Date.now()}`;

// Create axios instance with session support
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testPaymentFlow() {
  console.log('🚀 Starting Payment Flow Test');
  console.log('================================');

  try {
    // Step 1: Check initial user status
    console.log('\n1. Checking initial user status...');
    const initialStatus = await client.get('/api/user-status');
    console.log('Initial status:', initialStatus.data);

    // Step 2: Generate a book cover
    console.log('\n2. Generating first book cover...');
    const coverData = {
      bookTitle: "Payment Test Book",
      authorName: "Test Author",
      genre: "fantasy",
      keywords: "magic, test",
      mood: "epic"
    };
    
    const generateResponse = await client.post('/api/generate-cover', coverData);
    if (generateResponse.data.success) {
      console.log('✅ Cover generated successfully');
      console.log('Cover ID:', generateResponse.data.bookCover?.id);
      console.log('User status:', generateResponse.data.user);
    } else {
      throw new Error('Failed to generate cover: ' + generateResponse.data.error);
    }

    const coverId = generateResponse.data.bookCover?.id;

    // Step 3: Test first download (should be free)
    console.log('\n3. Testing first download (should be free)...');
    const downloadResponse = await client.post('/api/download-cover', { coverId });
    
    if (downloadResponse.data.success) {
      console.log('✅ Free download successful');
      console.log('Remaining free downloads:', downloadResponse.data.remainingFreeDownloads);
    } else {
      console.log('❌ Download failed:', downloadResponse.data.error);
    }

    // Step 4: Simulate using all free downloads
    console.log('\n4. Simulating depletion of free downloads...');
    
    // We'll manually decrease free downloads by making multiple downloads
    for (let i = 2; i <= 5; i++) {
      console.log(`Generating cover ${i}...`);
      const nextCover = await client.post('/api/generate-cover', {
        ...coverData,
        bookTitle: `Test Book ${i}`
      });
      
      if (nextCover.data.success) {
        const nextDownload = await client.post('/api/download-cover', { 
          coverId: nextCover.data.bookCover?.id 
        });
        console.log(`Download ${i}: ${nextDownload.data.success ? 'Success' : 'Failed'}`);
        if (nextDownload.data.remainingFreeDownloads !== undefined) {
          console.log(`Remaining: ${nextDownload.data.remainingFreeDownloads}`);
        }
      }
    }

    // Step 5: Try to download after free limit (should require payment)
    console.log('\n5. Testing download after free limit exhausted...');
    const finalCover = await client.post('/api/generate-cover', {
      ...coverData,
      bookTitle: "Final Test Book"
    });

    if (finalCover.data.success) {
      try {
        const paidDownload = await client.post('/api/download-cover', { 
          coverId: finalCover.data.bookCover?.id 
        });
        console.log('Download response:', paidDownload.data);
      } catch (error) {
        if (error.response?.status === 402) {
          console.log('✅ Payment required (expected behavior)');
          console.log('Payment required response:', error.response.data);
        } else {
          throw error;
        }
      }
    }

    // Step 6: Test payment initialization
    console.log('\n6. Testing payment initialization...');
    try {
      const paymentInit = await client.post('/api/initialize-payment', {
        email: 'test@example.com',
        amount: 100 // $1 in cents
      });
      
      if (paymentInit.data.success) {
        console.log('✅ Payment initialization successful');
        console.log('Payment data:', paymentInit.data.data);
      } else {
        console.log('❌ Payment initialization failed:', paymentInit.data.error);
      }
    } catch (error) {
      console.log('Payment init error:', error.response?.data || error.message);
    }

    // Step 7: Check final user status
    console.log('\n7. Checking final user status...');
    const finalStatus = await client.get('/api/user-status');
    console.log('Final status:', finalStatus.data);

    console.log('\n✅ Payment flow test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testPaymentFlow();