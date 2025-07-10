import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI || "");

export async function POST(request: NextRequest) {
  let fileName = 'unknown';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    fileName = file.name;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process with Gemini AI
    let extractedData;
    try {
      // Check if Gemini API key is available
      if (!process.env.NEXT_PUBLIC_GEMINI) {
        console.error('Gemini API key not found');
        return NextResponse.json({
          error: 'AI processing not configured. Please check API key configuration.'
        }, { status: 500 });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      let prompt = '';
      let fileData = null;

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        // For images and PDFs, send directly to Gemini AI
        const base64Data = buffer.toString('base64');
        fileData = {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        };
        prompt = `Extract all information from this resume ${file.type === 'application/pdf' ? 'PDF' : 'image'} and format it as JSON with the following structure:`;
      } else if (file.type === 'text/plain') {
        // For text files, read content directly
        const textContent = buffer.toString('utf-8');
        prompt = `Extract all information from this resume text and format it as JSON with the following structure:\n\nResume content:\n${textContent}\n\n`;
      } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOC/DOCX files, extract text using mammoth
        try {
          const result = await mammoth.extractRawText({ buffer });
          const textContent = result.value;
          prompt = `Extract all information from this resume text and format it as JSON with the following structure:\n\nResume content:\n${textContent}\n\n`;
        } catch (docError) {
          console.error('Document parsing error:', docError);
          return NextResponse.json({
            error: 'Failed to parse Word document. Please try converting to text or image format.'
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          error: 'Unsupported file type'
        }, { status: 400 });
      }

      prompt += `
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "dob": "Date of birth in YYYY-MM-DD format. This is VERY important - carefully look for any DOB, Date of Birth, Birth Date, or text containing 'born on' in the resume. When found, convert to YYYY-MM-DD format (e.g., 1990-05-15). If not found, return null. Do not mistake other dates like graduation or job start dates for DOB.",
  "location": {
    "city": "City name only. Extract just the city from the address, without any house number, street, or zip code. Look for context clues like 'residing in', 'based in', etc.",
    "state": "State or province name only. Extract just the state/province from the address.",
    "country": "Country name only. Extract just the country from the address. Default to 'India' if a country isn't explicitly mentioned but the resume appears to be from India."
  },
  "contactDetails": {
    "address": "address if available",
    "linkedin": "linkedin url if available",
    "github": "github url if available",
    "website": "personal website if available",
    "twitter": "twitter handle if available"
  },
  "socialLinks": ["array of social media links"],
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "tenure": "Duration (e.g., Jan 2020 - Dec 2022)",
      "startMonth": "Start month (e.g., January, Jan)",
      "startYear": "Start year (e.g., 2020)",
      "endMonth": "End month if available, or 'Present' if current job",
      "endYear": "End year if available, or current year if current job",
      "isCurrentJob": "true or false based on whether this is their current position",
      "description": "Job description",
      "skills": ["relevant skills used in this role - extract from job description"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "link": "project url if available",
      "description": "project description",
      "skills": ["technologies used"]
    }
  ],
  "skills": [
    "COMPREHENSIVE array of ALL skills - extract from EVERYWHERE in the resume:",
    "1. TECHNICAL SKILLS (for tech professionals):",
    "   - Programming languages, frameworks, libraries, tools",
    "   - Databases, cloud platforms, DevOps tools",
    "   - Software, IDEs, version control systems",
    "2. PROFESSIONAL SKILLS (inferred from work experience):",
    "   - If they 'led a team' → Team Leadership, People Management",
    "   - If they 'managed projects' → Project Management, Planning",
    "   - If they 'presented to clients' → Presentation Skills, Client Relations",
    "   - If they 'analyzed data/reports' → Data Analysis, Analytical Thinking",
    "   - If they 'coordinated with stakeholders' → Stakeholder Management",
    "   - If they 'trained employees' → Training & Development, Mentoring",
    "   - If they 'handled budgets' → Financial Management, Budget Planning",
    "3. DOMAIN-SPECIFIC SKILLS (based on industry/role):",
    "   - Marketing: Campaign Management, SEO, Social Media, Content Creation",
    "   - Sales: Lead Generation, Customer Acquisition, Negotiation",
    "   - Finance: Financial Analysis, Risk Assessment, Compliance",
    "   - HR: Recruitment, Performance Management, Employee Relations",
    "   - Operations: Process Optimization, Supply Chain, Quality Control",
    "4. SOFT SKILLS (mentioned or clearly demonstrated):",
    "   - Communication, Problem-solving, Critical Thinking",
    "   - Collaboration, Adaptability, Time Management",
    "   - Customer Service, Attention to Detail, Multi-tasking",
    "5. TOOLS & SOFTWARE (any mentioned):",
    "   - Microsoft Office, CRM systems, ERP software",
    "   - Design tools, Analytics platforms, etc.",
    "BE VERY COMPREHENSIVE - if someone worked in a role, they likely have the core skills for that role even if not explicitly stated"
  ],
  "education": [
    {
      "level": "Education level - classify exactly as one of: '10th', '12th', 'diploma', 'bachelor', 'master', 'phd', 'certificate'",
      "institution": "School/University/College Name",
      "degree": "Degree Name or Program Name",
      "field": "Field of Study or Subject",
      "year": "Graduation/Passing Year as a 4-digit number (e.g., 2020). Look for text like 'graduated', 'completed', 'class of', 'passed', etc.",
      "startYear": "Start year of education if available",
      "endYear": "End/graduation year if available",
      "score": "GPA/Percentage/CGPA if mentioned",
      "board": "For 10th/12th, extract the board name like CBSE, ICSE, State Board, etc."
    }
  ],
  "secondaryEducation": {
    "institution": "10th standard school name",
    "board": "Board name for 10th standard (like CBSE, ICSE, State Board)",
    "year": "Year of passing 10th standard",
    "percentage": "Percentage or grade obtained in 10th"
  },
  "higherSecondaryEducation": {
    "institution": "12th standard school/college name",
    "board": "Board name for 12th standard",
    "stream": "Stream in 12th (like Science, Commerce, Arts)",
    "year": "Year of passing 12th standard",
    "percentage": "Percentage or grade obtained in 12th"
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date of Issue"
    }
  ],
  "summary": "A long summary of the resume, including key achievements and career highlights, techniques used, and any notable contributions."
}

CRITICAL SKILL EXTRACTION INSTRUCTIONS:
- Extract ALL skills comprehensively - both explicitly mentioned AND inferred from work experience
- For TECHNICAL professionals: Include programming languages, frameworks, tools, databases, cloud platforms, methodologies (Agile, DevOps), system architecture, etc.
- For NON-TECHNICAL professionals: Include soft skills, business skills, industry expertise, client management, sales, marketing, finance, operations, etc.
- ANALYZE job descriptions for implied skills:
  * "managed team" → Team Management, Leadership, People Management
  * "client presentations" → Presentation Skills, Client Relations, Communication
  * "analyzed reports" → Data Analysis, Critical Thinking, Report Writing
  * "coordinated projects" → Project Coordination, Planning, Organization
  * "handled budgets" → Financial Management, Budget Planning
  * "trained staff" → Training & Development, Mentoring, Knowledge Transfer
  * "increased sales" → Sales Skills, Business Development, Performance Optimization
  * "social media campaigns" → Social Media Marketing, Digital Marketing, Content Creation
- Include DOMAIN EXPERTISE based on job titles and industries
- For each role, consider what skills are REQUIRED to perform those duties successfully
- Aim for 20-40 comprehensive skills that truly represent their capabilities
- Be thorough but relevant - quality over quantity, but don't miss obvious skills

Return only the JSON object, no additional text or formatting.`;

      const result = fileData
        ? await model.generateContent([prompt, fileData])
        : await model.generateContent(prompt);

      const response = await result.response;
      let text = response.text();

      // Log the raw AI response for debugging
      console.log('Raw AI response length:', text.length);
      console.log('Raw AI response preview:', text.substring(0, 200) + '...');

      try {
        // Clean up the response text
        text = text.replace(/```json\n?|\n?```/g, '').trim();
        
        // Additional cleanup for common AI response issues
        if (text.startsWith('```')) {
          text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
        }
        
        extractedData = JSON.parse(text);
        
        // Validate that we got the expected structure
        if (!extractedData.skills || !Array.isArray(extractedData.skills)) {
          console.warn('Skills array missing or invalid, providing fallback');
          extractedData.skills = [];
        }
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw text that failed to parse:', text);
        
        // Try to extract just the JSON part if there's extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[0]);
          } catch (retryError) {
            console.error('Retry parsing also failed:', retryError);
            return NextResponse.json({
              error: 'Failed to parse AI response',
              rawResponse: text.substring(0, 1000), // Limit response size
              details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({
            error: 'Failed to parse AI response - no valid JSON found',
            rawResponse: text.substring(0, 1000),
            details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          }, { status: 500 });
        }
      }

    } catch (aiError) {
      console.error('Gemini AI error details:', aiError);
      
      // Check if it's a specific type of error
      if (aiError instanceof Error) {
        const errorMessage = aiError.message.toLowerCase();
        
        if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
          // Return fallback response for overloaded API
          return NextResponse.json({
            success: true,
            fileName: fileName,
            extractedData: {
              name: '',
              email: '',
              phone: '',
              skills: [],
              experience: [],
              education: [],
              summary: ''
            },
            aiProcessed: false,
            message: 'AI service is temporarily overloaded. File uploaded successfully - please fill the form manually. You can try uploading again later for auto-fill.'
          });
        }
        
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          return NextResponse.json({
            success: true,
            fileName: fileName,
            extractedData: {
              name: '',
              email: '',
              phone: '',
              skills: [],
              experience: [],
              education: [],
              summary: ''
            },
            aiProcessed: false,
            message: 'AI service quota exceeded. File uploaded successfully - please fill the form manually.'
          });
        }
        
        if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
          return NextResponse.json({
            error: 'AI service configuration error. Please contact support.',
            details: 'Invalid or missing API key'
          }, { status: 401 });
        }
      }
      
      // Generic AI error - provide fallback
      return NextResponse.json({
        success: true,
        fileName: fileName,
        extractedData: {
          name: '',
          email: '',
          phone: '',
          skills: [],
          experience: [],
          education: [],
          summary: ''
        },
        aiProcessed: false,
        message: 'AI processing encountered an error. File uploaded successfully - please fill the form manually.',
        error: 'AI processing failed - manual entry available'
      });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      extractedData: extractedData,
      aiProcessed: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Return a fallback response that allows manual form filling
    return NextResponse.json({
      success: true,
      fileName: fileName,
      extractedData: {
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: [],
        education: [],
        summary: ''
      },
      aiProcessed: false,
      message: 'File uploaded successfully, but AI processing failed. Please fill the form manually.',
      error: 'AI processing failed, manual entry required'
    });
  }
}
