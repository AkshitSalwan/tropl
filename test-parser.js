// Test script to check if the resume parser is working
const fs = require('fs');
const path = require('path');

async function testResumeParser() {
  try {
    // Create a simple test resume content
    const testResumeText = `
    John Doe
    Email: john.doe@example.com
    Phone: +1-234-567-8900
    Date of Birth: May 15, 1990
    Location: San Francisco, California, USA
    
    EXPERIENCE:
    Software Engineer at Google (2020-2023)
    Junior Developer at Microsoft (2018-2020)
    
    EDUCATION:
    Bachelor of Computer Science, Stanford University (2018)
    
    SKILLS:
    JavaScript, Python, React, Node.js, AWS, Docker
    `;

    // Create a test file
    const testFile = new Blob([testResumeText], { type: 'text/plain' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', testFile, 'test-resume.txt');

    // Test the API
    const response = await fetch('http://localhost:3000/api/upload-resume', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Parser is working!');
      console.log('📊 Extracted Data:', JSON.stringify(result.extractedData, null, 2));
    } else {
      console.log('❌ Parser failed:');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testResumeParser();
