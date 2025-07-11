const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
    const API_KEY = 'AIzaSyAKbKfp2-V5hkLUvZM49VzBDUJBZLkwj5k';
    
    try {
        console.log('Testing Gemini API...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = "Hello, can you respond with a simple JSON object containing just {\"status\": \"working\", \"message\": \"API is functional\"}?";
        
        console.log('Sending request...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ API Response:', text);
        console.log('✅ API is working!');
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        if (error.message.includes('overloaded') || error.message.includes('503')) {
            console.log('🔥 Reason: Google Gemini servers are currently overloaded');
            console.log('💡 This happens when:');
            console.log('   - High global usage of Gemini API');
            console.log('   - Peak hours (US/Europe business hours)');
            console.log('   - Maintenance or capacity issues');
        } else if (error.message.includes('quota') || error.message.includes('429')) {
            console.log('⚠️  Reason: API quota/rate limit exceeded');
            console.log('💡 This happens when:');
            console.log('   - Too many requests in short time');
            console.log('   - Daily/monthly quota reached');
            console.log('   - Need to upgrade API plan');
        } else if (error.message.includes('API key') || error.message.includes('403')) {
            console.log('🔑 Reason: API key issue');
            console.log('💡 This happens when:');
            console.log('   - Invalid API key');
            console.log('   - API key restrictions');
            console.log('   - Billing issues');
        } else {
            console.log('❓ Unknown error - check Google AI Studio console');
        }
    }
}

testGeminiAPI();
