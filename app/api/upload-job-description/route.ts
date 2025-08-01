import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

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
        prompt = `Extract all information from this job description ${file.type === 'application/pdf' ? 'PDF' : 'image'} and format it as JSON with the following structure:`;
      } else if (file.type === 'text/plain') {
        // For text files, read content directly
        const textContent = buffer.toString('utf-8');
        prompt = `Extract all information from this job description text and format it as JSON with the following structure:\n\nJob Description content:\n${textContent}\n\n`;
      } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOC/DOCX files, extract text using mammoth
        try {
          const result = await mammoth.extractRawText({ buffer });
          const textContent = result.value;
          prompt = `Extract all information from this job description text and format it as JSON with the following structure:\n\nJob Description content:\n${textContent}\n\n`;
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
  "jobTitle": "Job Title/Position Name",
  "companyName": "Company Name if mentioned",
  "department": "Department if mentioned",
  "location": {
    "city": "City name if mentioned",
    "state": "State name if mentioned",
    "country": "Country name if mentioned",
    "isRemote": "true/false - whether the job is remote or allows remote work",
    "isHybrid": "true/false - whether the job is hybrid",
    "isOnsite": "true/false - whether the job requires onsite work"
  },
  "jobType": "Full-time/Part-time/Contract/Internship/Temporary",
  "experienceLevel": "Entry Level/Mid Level/Senior Level/Executive",
  "experienceRequired": "Number of years of experience required (e.g., 2-5 years, 5+ years)",
  "salaryRange": {
    "min": "Minimum salary if mentioned",
    "max": "Maximum salary if mentioned",
    "currency": "Currency (e.g., USD, INR)",
    "period": "per year/per month/per hour"
  },
  "description": "Complete job description text",
  "responsibilities": [
    "List of job responsibilities and duties"
  ],
  "requirements": {
    "education": "Educational requirements",
    "skills": [
      "List of required technical and soft skills (all skills except those specifically under 'Additional Skills')"
    ],
    "experience": "Experience requirements details",
    "certifications": [
      "Required certifications if any"
    ]
  },
  "preferredQualifications": [
    "Nice-to-have qualifications"
  ],
  "benefits": [
    "List of benefits offered"
  ],
  "applicationDeadline": "Application deadline if mentioned (YYYY-MM-DD format)",
  "contactInfo": {
    "email": "Contact email if mentioned",
    "phone": "Contact phone if mentioned",
    "person": "Contact person name if mentioned"
  },
  "workSchedule": "Work schedule details if mentioned",
  "travelRequirements": "Travel requirements if mentioned",
  "industryType": "Industry type/sector",
  "companySize": "Company size if mentioned",
  "jobCode": "Job code/reference number if mentioned",
  "summary": "A comprehensive summary of the job posting including key highlights, main responsibilities, and ideal candidate profile",
  "additionalSkills": [
    "List of additional skills ONLY IF they are specifically mentioned under a section or heading called 'Additional Skills' in the document. If not present, leave this as an empty array."
  ]
}

IMPORTANT INSTRUCTIONS:
- Extract information exactly as written in the job description
- For skills, include both technical skills (programming languages, tools, frameworks) and soft skills
- For the 'additionalSkills' field, ONLY extract skills if they are specifically mentioned under a section or heading called 'Additional Skills' in the document. If not present, leave this as an empty array. Do NOT duplicate skills from the main skills list here unless they are under 'Additional Skills'.
- All other skills should be included under 'requirements.skills' (key skills).
- For location, carefully determine if the job is remote, hybrid, or onsite based on the description
- For salary, extract the exact range mentioned, don't make assumptions
- For experience level, categorize based on years of experience mentioned
- If any field is not mentioned in the job description, return null or empty array as appropriate
- Pay special attention to required vs preferred qualifications

Return only the JSON object, no additional text or formatting.`;

      const result = fileData
        ? await model.generateContent([prompt, fileData])
        : await model.generateContent(prompt);

      const response = await result.response;
      let text = response.text();

      try {
        text = text.replace(/```json\n?|\n?```/g, '').trim();
        extractedData = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return NextResponse.json({
          error: 'Failed to parse AI response',
          rawResponse: text
        }, { status: 500 });
      }

    } catch (aiError) {
      console.error('Gemini AI error:', aiError);
      return NextResponse.json({
        error: 'Failed to process job description with AI',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      extractedData: extractedData
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
