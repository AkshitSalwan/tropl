import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Upload as UploadIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "use-debounce";

interface ResumeFormProps {
  onSubmit: (data: any) => void;
  submitButtonText?: string;
  isSubmitting?: boolean;
  isRecruiterAdding?: boolean; // New prop to indicate recruiter is adding candidate
  editData?: any; // Data to pre-populate form for editing
  isEditing?: boolean; // Whether this is edit mode
}

export function ResumeForm({ 
  onSubmit, 
  submitButtonText = "Save Resume Details",
  isSubmitting = false,
  isRecruiterAdding = false,
  editData = null,
  isEditing = false
}: ResumeFormProps) {
  const { token } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Email validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Experiences state
  const [experiences, setExperiences] = useState([
    { client: "", startMonth: "", startYear: "", endMonth: "", endYear: "", present: false, responsibilities: "" }
  ]);
  // Education state
  const [education, setEducation] = useState([
    { degree: "", institution: "", year: "", educationLevel: "" }
  ]);
  
  // References state
  const [references, setReferences] = useState([
    { name: "", designation: "", email: "", phone: "" }
  ]);
  
  // Other documents state
  const [otherDocuments, setOtherDocuments] = useState([
    { type: "", name: "", file: null as File | null }
  ]);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    jobTitle: "",
    salary: "",
    expectedSalary: "",
    noticePeriod: "",
    experience: "",
    relocate: "",
    summary: "",
    dob: "",
    gender: "",
    country: "India",
    state: "",
    city: "",
    aadhaar: "",
    pan: "",
    uan: "",
    employerName: "",
    recruiterName: "",
    recruiterEmail: "",
    recruiterContact: ""
  });

  // Debounced email for validation
  const [debouncedEmail] = useDebounce(formData.email, 500);

  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);

  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const { uploadSingleFile, isUploading, uploadProgress } = useFileUpload();

  // Email validation function
  const checkEmailExists = useCallback(async (email: string) => {
    if (!token || !email) return;

    // Don't validate if it's the initial email in edit mode
    if (isEditing && editData && email === editData.email) {
      setEmailError(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailError(null);
    try {
      const response = await fetch('/api/candidates/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const result = await response.json();
        if (response.status === 409) {
          setEmailError(result.error || "This email is already in use.");
        }
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error('Failed to check email:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  }, [token, isEditing, editData]);

  // Effect to validate email when it changes
  useEffect(() => {
    if (debouncedEmail) {
      checkEmailExists(debouncedEmail);
    }
  }, [debouncedEmail, checkEmailExists]);

  // Populate form with edit data when editing
  useEffect(() => {
    if (isEditing && editData) {
      // Convert candidate data to form data format
      setFormData({
        firstName: editData.firstName || "",
        middleName: editData.middleName || "",
        lastName: editData.lastName || "",
        email: editData.email || "",
        phone: editData.phone || "",
        linkedin: editData.linkedin || "",
        github: editData.github || "",
        jobTitle: editData.jobTitle || "",
        salary: editData.currentSalary?.toString() || "",
        expectedSalary: editData.expectedSalary?.toString() || "",
        noticePeriod: editData.noticePeriod || "",
        experience: editData.experience?.toString() || "",
        relocate: editData.relocate || "",
        summary: editData.profileSummary || editData.summary || "",
        dob: editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : "",
        gender: editData.gender || "",
        country: editData.country || "India",
        state: editData.state || "",
        city: editData.city || "",
        aadhaar: editData.aadhaar || "",
        pan: editData.pan || "",
        uan: editData.uan || "",
        employerName: editData.employerName || "",
        recruiterName: editData.recruiterName || "",
        recruiterEmail: editData.recruiterEmail || "",
        recruiterContact: editData.recruiterContact || ""
      });

      // Set skills data
      if (editData.skills) {
        setSkills(editData.skills);
      }
      if (editData.selectedSkills) {
        setSelectedSkills(editData.selectedSkills);
      }

      // Set complex data
      if (editData.experiences) {
        setExperiences(editData.experiences);
      }
      if (editData.education) {
        setEducation(editData.education);
      }
      if (editData.references) {
        setReferences(editData.references);
      }
      if (editData.resumeUrl) {
        setUploadedResumeUrl(editData.resumeUrl);
      }
    }
  }, [isEditing, editData]);

  // Form validation function
  const validateRequiredFields = () => {
    const requiredFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email ID',
      phone: 'Phone Number',
      dob: 'Date of Birth',
      city: 'Current Location (City)',
      state: 'Current Location (State)',
      country: 'Current Location (Country)',
      relocate: 'Open to Relocation',
      salary: 'Current Salary',
      expectedSalary: 'Expected Salary'
    };

    const missingFields: string[] = [];
    const invalidFieldIds: string[] = [];
    
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof typeof formData]) {
        missingFields.push(label);
        invalidFieldIds.push(field);
      }
    }

    if (skills.length === 0) {
      missingFields.push('Key Skills');
      invalidFieldIds.push('skills-section');
    }
    
    if (selectedSkills.length !== 10) {
      missingFields.push('10 Skills Selection (exactly 10 skills must be selected)');
      invalidFieldIds.push('selected-skills-section');
    }

    return { missingFields, invalidFieldIds };
  };

  // Function to scroll to and focus on the first invalid field
  const scrollToFirstInvalidField = (invalidFieldIds: string[]) => {
    if (invalidFieldIds.length === 0) return;

    const firstInvalidFieldId = invalidFieldIds[0];
    const element = document.getElementById(firstInvalidFieldId);
    
    if (element) {
      // Scroll to the element with some offset for better visibility
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });

      // Focus and highlight the element
      setTimeout(() => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.focus();
          // Add a highlight effect for input elements
          element.style.borderColor = '#ef4444';
          element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.style.borderColor = '';
            element.style.boxShadow = '';
          }, 3000);
        } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'combobox') {
          // For Select components (Radix UI renders as button with role="combobox")
          element.focus();
          // Add a highlight effect for select elements
          element.style.outline = '2px solid #ef4444';
          element.style.outlineOffset = '2px';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
          }, 3000);
        } else {
          // For other elements like sections, add a subtle background highlight
          element.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
          element.style.border = '2px solid rgba(239, 68, 68, 0.2)';
          element.style.borderRadius = '4px';
          element.style.padding = '8px';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.border = '';
            element.style.borderRadius = '';
            element.style.padding = '';
          }, 3000);
        }
      }, 500);
    }
  };

  const handleSubmit = async () => {
    // Check for email validation errors first
    if (emailError) {
      setUploadStatus({
        status: 'error',
        message: emailError
      });
      return;
    }

    if (!token) {
      setUploadStatus({
        status: 'error',
        message: 'Please log in to save your resume'
      });
      return;
    }

    const validationResult = validateRequiredFields();
    if (validationResult.missingFields.length > 0) {
      // Scroll to the first invalid field
      scrollToFirstInvalidField(validationResult.invalidFieldIds);
      
      setUploadStatus({
        status: 'error',
        message: `Please fill the following required fields: ${validationResult.missingFields.join(', ')}`
      });
      return;
    }

    setUploadStatus({ status: 'uploading', message: 'Saving resume data...' });

    try {
      // First, upload the resume file if there's a pending file
      if (pendingResumeFile && !uploadedResumeUrl) {
        setUploadStatus({ status: 'uploading', message: 'Uploading resume file...' });
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', pendingResumeFile);

        const uploadResponse = await fetch('/api/candidates/upload-resume', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Failed to upload resume file');
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.data?.fileUrl) {
          setUploadedResumeUrl(uploadResult.data.fileUrl);
        }
        
        // Clear the pending file since it's now uploaded
        setPendingResumeFile(null);
        
        setUploadStatus({ status: 'uploading', message: 'Saving resume data...' });
      }

      // Prepare data in the format expected by the API
      const submitData = {
        // Personal Information
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        
        // Contact Information
        linkedin: formData.linkedin,
        github: formData.github,
        
        // Location Information
        country: formData.country,
        state: formData.state,
        city: formData.city,
        
        // Professional Information
        jobTitle: formData.jobTitle,
        experience: formData.experience,
        expectedSalary: formData.expectedSalary,
        currentSalary: formData.salary,
        noticePeriod: formData.noticePeriod,
        relocate: formData.relocate,
        summary: formData.summary,
        
        // Skills
        skills,
        selectedSkills,
        
        // ID Information
        aadhaar: formData.aadhaar,
        pan: formData.pan,
        uan: formData.uan,
        
        // Employer Information
        employerName: formData.employerName,
        recruiterName: formData.recruiterName,
        recruiterEmail: formData.recruiterEmail,
        recruiterContact: formData.recruiterContact,
        
        // Arrays
        experiences,
        education,
        references,
        otherDocuments,
        
        // Resume file URL if uploaded
        resumeUrl: uploadedResumeUrl,
      };

      // Determine API endpoint and method based on mode
      let apiUrl: string;
      let method: string;

      if (isEditing && editData) {
        // Edit mode - update existing candidate
        apiUrl = isRecruiterAdding 
          ? `/api/candidates/${editData.id}` 
          : '/api/candidates/resume';
        method = 'PUT';
      } else {
        // Add mode - create new candidate
        apiUrl = isRecruiterAdding 
          ? '/api/candidates/add-by-recruiter' 
          : '/api/candidates/resume';
        method = 'POST';
      }

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save resume');
      }

      if (result.success) {
        // Clear pending file since it's now saved
        setPendingResumeFile(null);
        
        setUploadStatus({
          status: 'success',
          message: result.message || 'Resume saved successfully!'
        });
        onSubmit(result.data);
      } else {
        throw new Error(result.error || 'Failed to save resume');
      }

    } catch (error) {
      console.error('Submit error:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save resume'
      });
    }
  };

  // Helper function to parse date strings and extract month/year
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return { month: '', year: '' };
    
    // Handle different date formats
    const monthNames = [
      'jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 
      'may', 'jun', 'june', 'jul', 'july', 'aug', 'august', 'sep', 'sept', 
      'september', 'oct', 'october', 'nov', 'november', 'dec', 'december'
    ];
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMapping = {
      'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
      'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
      'aug': 7, 'august': 7, 'sep': 8, 'sept': 8, 'september': 8, 'oct': 9, 
      'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
    };
    
    const lowerStr = dateStr.toLowerCase();
    
    // Try to find month
    let month = '';
    let year = '';
    
    for (const [monthName, monthIndex] of Object.entries(monthMapping)) {
      if (lowerStr.includes(monthName)) {
        month = monthAbbr[monthIndex];
        break;
      }
    }
    
    // Try to find year (4 digits)
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) {
      year = yearMatch[0];
    }
    
    return { month, year };
  };

  // Helper function to parse tenure string and extract dates
  const parseTenureString = (tenure: string) => {
    if (!tenure) return { startMonth: '', startYear: '', endMonth: '', endYear: '', present: false };
    
    // Handle formats like "Jan 2020 - Dec 2022" or "Jan 2020 - Present"
    const parts = tenure.split(' - ');
    if (parts.length === 2) {
      const startDate = parseDateString(parts[0]);
      const endPart = parts[1].toLowerCase();
      
      if (endPart.includes('present') || endPart.includes('current')) {
        return {
          startMonth: startDate.month,
          startYear: startDate.year,
          endMonth: '',
          endYear: '',
          present: true
        };
      } else {
        const endDate = parseDateString(parts[1]);
        return {
          startMonth: startDate.month,
          startYear: startDate.year,
          endMonth: endDate.month,
          endYear: endDate.year,
          present: false
        };
      }
    }
    
    return { startMonth: '', startYear: '', endMonth: '', endYear: '', present: false };
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Toggle skill selection for up to 10 skills
  const toggleSkillSelection = (skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        // Remove if already selected
        return prev.filter(s => s !== skill);
      } else {
        // Add if not selected and less than 10 skills are selected
        if (prev.length < 10) {
          return [...prev, skill];
        }
        return prev;
      }
    });
  };

  // Experience handlers
  const addExperience = () => setExperiences([...experiences, { client: "", startMonth: "", startYear: "", endMonth: "", endYear: "", present: false, responsibilities: "" }]);
  const removeExperience = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));
  const updateExperience = (idx: number, field: string, value: any) => {
    setExperiences(experiences.map((exp, i) => i === idx ? { ...exp, [field]: value } : exp));
  };

  // Education handlers
  const addEducation = () => setEducation([...education, { degree: "", institution: "", year: "", educationLevel: "" }]);
  const removeEducation = (idx: number) => setEducation(education.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, field: string, value: any) => {
    setEducation(education.map((edu, i) => i === idx ? { ...edu, [field]: value } : edu));
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for email validation errors before allowing file upload
    if (emailError) {
      setUploadStatus({
        status: 'error',
        message: 'Please correct the email error before uploading a resume.'
      });
      return;
    }

    if (!token) {
      setUploadStatus({
        status: 'error',
        message: 'Please log in to upload your resume'
      });
      return;
    }

    // Clear any existing uploaded URL if user is selecting a new file
    if (uploadedResumeUrl) {
      setUploadedResumeUrl(null);
    }

    setUploadStatus({ status: 'uploading', message: 'Processing resume with AI...' });

    try {
      // Store the file temporarily (don't save to server yet)
      setPendingResumeFile(file);

      // Process with AI for auto-fill using the existing upload-resume API
      const result = await uploadSingleFile(file);
      
      if (result.success && result.extractedData) {
        const data = result.extractedData;
        
        // Debug logging
        console.log('AI Extracted Data:', data);
        console.log('Education data specifically:', {
          education: data.education,
          secondaryEducation: data.secondaryEducation,
          higherSecondaryEducation: data.higherSecondaryEducation,
          certifications: data.certifications
        });
        
        // Format DOB to work with date input if present
        let formattedDob = '';
        if (data.dob) {
          // If dob is already in YYYY-MM-DD format, use it directly
          if (/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) {
            formattedDob = data.dob;
          } else {
            // Try to parse the date
            try {
              const dateObj = new Date(data.dob);
              if (!isNaN(dateObj.getTime())) {
                formattedDob = dateObj.toISOString().split('T')[0];
              }
            } catch (error) {
              console.error('Failed to parse DOB:', error);
            }
          }
        }
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          firstName: data.name?.split(' ')[0] || prev.firstName,
          lastName: data.name?.split(' ').slice(1).join(' ') || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          linkedin: data.contactDetails?.linkedin || prev.linkedin,
          github: data.contactDetails?.github || prev.github,
          summary: data.summary || prev.summary,
          // Map DOB from extracted data with formatting
          dob: formattedDob || prev.dob,
          // Use structured location data if available
          city: data.location?.city || data.contactDetails?.address?.split(',')[0] || prev.city,
          state: data.location?.state || data.contactDetails?.address?.split(',')[1]?.trim() || prev.state,
          country: data.location?.country || prev.country,
        }));

        // Auto-fill skills
        if (data.skills && data.skills.length > 0) {
          console.log('Auto-filling skills:', data.skills);
          setSkills(data.skills);
          // Reset selected skills when new skills are loaded
          setSelectedSkills([]);
        }

        // Auto-fill experience with enhanced date parsing
        if (data.experience && data.experience.length > 0) {
          const mappedExperiences = data.experience.map((exp: any) => {
            // Try to use extracted month/year fields first
            let expData = {
              client: exp.company || '',
              startMonth: exp.startMonth || '',
              startYear: exp.startYear || '',
              endMonth: exp.endMonth || '',
              endYear: exp.endYear || '',
              present: exp.isCurrentJob || false,
              responsibilities: exp.responsibilities || exp.description || exp.duties || exp.jobDescription || ''
            };
            
            // If month/year fields are not available, try to parse tenure string
            if (!expData.startMonth && !expData.startYear && exp.tenure) {
              console.log('Parsing tenure string:', exp.tenure);
              const parsedTenure = parseTenureString(exp.tenure);
              expData = {
                ...expData,
                startMonth: parsedTenure.startMonth,
                startYear: parsedTenure.startYear,
                endMonth: parsedTenure.endMonth,
                endYear: parsedTenure.endYear,
                present: parsedTenure.present
              };
            }
            
            console.log('Mapped experience:', expData);
            return expData;
          });
          setExperiences(mappedExperiences);
        }

        // Auto-fill education with enhanced parsing
        let allEducationEntries: Array<{ degree: string; institution: string; year: string; educationLevel: string }> = [];
        
        // Process general education entries
        if (data.education && data.education.length > 0) {
          const mappedEducation = data.education.map((edu: any) => {
            let degree = '';
            let year = '';
            let institution = '';
            let educationLevel = '';
            
            // Determine education level based on keywords or explicit level field
            if (edu.level) {
              educationLevel = edu.level;
            } else if (edu.degree && typeof edu.degree === 'string') {
              const degreeStr = edu.degree.toLowerCase();
              if (degreeStr.includes('10th') || degreeStr.includes('secondary') || degreeStr.includes('sslc')) {
                educationLevel = '10th';
              } else if (degreeStr.includes('12th') || degreeStr.includes('higher secondary') || degreeStr.includes('hsc') || degreeStr.includes('puc')) {
                educationLevel = '12th';
              } else if (degreeStr.includes('bachelor') || degreeStr.includes('b.') || degreeStr.includes('ba') || degreeStr.includes('bs') || degreeStr.includes('btech')) {
                educationLevel = 'bachelor';
              } else if (degreeStr.includes('master') || degreeStr.includes('m.') || degreeStr.includes('ma') || degreeStr.includes('ms') || degreeStr.includes('mtech')) {
                educationLevel = 'master';
              } else if (degreeStr.includes('phd') || degreeStr.includes('doctorate')) {
                educationLevel = 'phd';
              } else if (degreeStr.includes('diploma')) {
                educationLevel = 'diploma';
              } else if (degreeStr.includes('certif')) {
                educationLevel = 'certificate';
              }
            }
            
            // Extract institution name
            if (edu.institution) {
              institution = edu.institution;
            } else if (edu.school) {
              institution = edu.school;
            } else if (edu.university) {
              institution = edu.university;
            } else if (edu.college) {
              institution = edu.college;
            }
            
            // Build degree string
            if (edu.degree && edu.field) {
              degree = `${edu.degree} in ${edu.field}`;
            } else if (edu.degree) {
              degree = edu.degree;
            } else if (edu.major) {
              degree = edu.major;
            } else if (edu.course) {
              degree = edu.course;
            }
            
            // For 10th and 12th, ensure we set reasonable values
            if (educationLevel === '10th' && !degree) {
              degree = 'Secondary School Certificate';
            } else if (educationLevel === '12th' && !degree) {
              degree = 'Higher Secondary Certificate';
            }
            
            // Determine year - try multiple fields with preference order
            year = edu.year || edu.endYear || edu.startYear || edu.graduationYear || '';
            
            // If we have a year string but not a number, try to extract it
            if (year && !/^\d{4}$/.test(year)) {
              const yearMatch = year.match(/\d{4}/);
              if (yearMatch) {
                year = yearMatch[0];
              }
            }
            
            // If still no year, try to extract from duration or any other field
            if (!year) {
              // Check all object properties for a 4-digit year
              for (const prop in edu) {
                if (typeof edu[prop] === 'string') {
                  const yearMatch = edu[prop].match(/\d{4}/g);
                  if (yearMatch && yearMatch.length > 0) {
                    // Prefer the last year as it's likely the graduation year
                    year = yearMatch[yearMatch.length - 1];
                    break;
                  }
                }
              }
            }
            
            console.log('Mapped education:', { degree, institution, year, educationLevel, original: edu });
            return { degree, institution, year, educationLevel };
          });
          allEducationEntries = [...mappedEducation];
        }

        // Handle specific 10th and 12th standard education details
        if (data.secondaryEducation) {
          const tenth = {
            degree: "Secondary School Certificate",
            institution: data.secondaryEducation.institution || "",
            year: data.secondaryEducation.year || "",
            educationLevel: "10th"
          };
          
          console.log('Found 10th standard details:', tenth);
          allEducationEntries.push(tenth);
        }
        
        if (data.higherSecondaryEducation) {
          const stream = data.higherSecondaryEducation.stream 
            ? ` (${data.higherSecondaryEducation.stream})`
            : "";
            
          const twelfth = {
            degree: `Higher Secondary Certificate${stream}`,
            institution: data.higherSecondaryEducation.institution || "",
            year: data.higherSecondaryEducation.year || "",
            educationLevel: "12th"
          };
          
          console.log('Found 12th standard details:', twelfth);
          allEducationEntries.push(twelfth);
        }

        // Handle certifications as additional education entries
        if (data.certifications && data.certifications.length > 0) {
          const mappedCertifications = data.certifications.map((cert: any) => {
            let degree = cert.name || '';
            let year = cert.year || '';
            let institution = cert.issuer || cert.organization || '';
            const educationLevel = 'certificate'; // Set all certifications to certificate level
            
            // Try to extract year from date if year not available
            if (!year && cert.date) {
              const dateYear = cert.date.match(/\d{4}/);
              if (dateYear) {
                year = dateYear[0];
              }
            }
            
            // If issuer/organization is not already included in institution and not in degree
            if (cert.issuer && !institution && !degree.includes(cert.issuer)) {
              degree = degree ? `${degree} by ${cert.issuer}` : cert.issuer;
            }
            
            console.log('Mapped certification:', { degree, institution, year, educationLevel, original: cert });
            return { degree, institution, year, educationLevel };
          });
          // Add certifications to existing education
          allEducationEntries = [...allEducationEntries, ...mappedCertifications];
        }

        // Set all education entries at once
        if (allEducationEntries.length > 0) {
          console.log('Setting education entries:', allEducationEntries);
          setEducation(allEducationEntries);
        } else {
          console.log('No education entries found to set');
        }

        setUploadStatus({ 
          status: 'success', 
          message: `Resume processed successfully! Auto-filled ${
            data.experience?.length || 0
          } experience entries, ${
            data.education?.length || 0
          } education entries, and ${
            data.certifications?.length || 0
          } certifications. File will be saved when you click "Save Resume Details".`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to process resume' 
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const years = Array.from({ length: 50 }, (_, i) => `${new Date().getFullYear() - i}`);

  // Add state and city options
  const stateOptions = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry", "Jammu and Kashmir", "Ladakh"
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Resume upload with AI processing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resume (AI Processing Enabled)</h3>
        
        {/* Upload Status Alert */}
        {uploadStatus.status !== 'idle' && (
          <Alert className={uploadStatus.status === 'error' ? 'border-red-200 bg-red-50' : 
                           uploadStatus.status === 'success' ? 'border-green-200 bg-green-50' : 
                           'border-blue-200 bg-blue-50'}>
            <div className="flex items-center gap-2">
              {uploadStatus.status === 'uploading' && <UploadIcon className="h-4 w-4 animate-spin" />}
              {uploadStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {uploadStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </div>
            {uploadStatus.status === 'uploading' && Object.keys(uploadProgress).length > 0 && (
              <div className="mt-2">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="space-y-1">
                    <div className="text-xs text-gray-600">{fileName}</div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </Alert>
        )}

        <div className="space-y-2">
          <Input 
            id="resume" 
            type="file" 
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" 
            onChange={handleResumeUpload}
            disabled={isUploading}
          />
          <div className="text-xs text-gray-500">
            Supported: PDF, DOC, DOCX, TXT, JPG, PNG
          </div>
          
          {/* Show pending file status */}
          {pendingResumeFile && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <UploadIcon className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-800">
                  File selected: {pendingResumeFile.name}
                </div>
                <div className="text-xs text-yellow-600">
                  File will be saved when you click "Save Resume Details"
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPendingResumeFile(null)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Show uploaded file status */}
          {uploadedResumeUrl && !pendingResumeFile && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-green-800">
                Resume file uploaded successfully
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information - with auto-filled values */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name<span className="text-red-500">*</span></Label>
            <Input 
              id="firstName" 
              required 
              value={formData.firstName}
              onChange={(e) => updateFormData('firstName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input 
              id="middleName" 
              value={formData.middleName}
              onChange={(e) => updateFormData('middleName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name<span className="text-red-500">*</span></Label>
            <Input 
              id="lastName" 
              required 
              value={formData.lastName}
              onChange={(e) => updateFormData('lastName', e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="dob">Date of Birth<span className="text-red-500">*</span></Label>
            <Input 
              id="dob" 
              type="date" 
              required
              value={formData.dob}
              onChange={(e) => updateFormData('dob', e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country<span className="text-red-500">*</span></Label>
            <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">India</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State<span className="text-red-500">*</span></Label>
            <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City<span className="text-red-500">*</span></Label>
            <Input 
              id="city" 
              placeholder="Enter city" 
              required
              value={formData.city}
              onChange={(e) => updateFormData('city', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact Information - with auto-filled values */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
            />
            {isCheckingEmail && <p className="text-xs text-gray-500">Checking email...</p>}
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Number<span className="text-red-500">*</span></Label>
            <Input 
              id="phone" 
              type="tel" 
              required 
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input 
              id="linkedin" 
              value={formData.linkedin}
              onChange={(e) => updateFormData('linkedin', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input 
              id="github" 
              value={formData.github}
              onChange={(e) => updateFormData('github', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Professional Information - with auto-filled values */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Professional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input 
              id="experience" 
              type="number" 
              value={formData.experience}
              onChange={(e) => updateFormData('experience', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Current Salary<span className="text-red-500">*</span></Label>
            <Input 
              id="salary" 
              type="number" 
              placeholder="Enter current salary"
              required
              value={formData.salary}
              onChange={(e) => updateFormData('salary', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedSalary">Expected Salary<span className="text-red-500">*</span></Label>
            <Input 
              id="expectedSalary" 
              type="number" 
              placeholder="Enter expected salary"
              required
              value={formData.expectedSalary}
              onChange={(e) => updateFormData('expectedSalary', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noticePeriod">Notice Period</Label>
            <Input 
              id="noticePeriod" 
              placeholder="e.g., 30 days, 2 months"
              value={formData.noticePeriod}
              onChange={(e) => updateFormData('noticePeriod', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relocate">Open to Relocation<span className="text-red-500">*</span></Label>
            <Select value={formData.relocate} onValueChange={(value) => updateFormData('relocate', value)}>
              <SelectTrigger id="relocate">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary field - spans full width */}
        <div className="space-y-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea 
            id="summary" 
            placeholder="Enter a brief professional summary highlighting key achievements, career highlights, and expertise..."
            value={formData.summary}
            onChange={(e) => updateFormData('summary', e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="text-xs text-gray-500">
            This will be auto-filled when you upload a resume with AI processing enabled.
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4" id="skills-section">
        <h3 className="text-lg font-medium">Key Skills<span className="text-red-500">*</span></h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill"
            />
            <Button onClick={addSkill}>Add</Button>
          </div>
          {/* All skills list */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge 
                key={`${skill}-${index}`} 
                variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                className={`cursor-pointer ${selectedSkills.includes(skill) ? 'bg-primary text-white' : ''}`}
                onClick={() => toggleSkillSelection(skill)}
              >
                {skill}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(skill);
                    // Also remove from selected skills if it was selected
                    if (selectedSkills.includes(skill)) {
                      setSelectedSkills(prev => prev.filter(s => s !== skill));
                    }
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {/* Skills selection instructions */}
          <Alert className={skills.length > 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'} id="selected-skills-section">
            <div className="text-sm">
              <p className="font-semibold">
                Please select exactly 10 skills from the list above by clicking on them.
              </p>
              <p className="mt-1">
                Selected skills: {selectedSkills.length}/10
              </p>
              {selectedSkills.length > 10 && (
                <p className="text-red-500 mt-1">
                  You've selected too many skills. Please remove {selectedSkills.length - 10} skill(s).
                </p>
              )}
              {selectedSkills.length < 10 && skills.length >= 10 && (
                <p className="text-blue-600 mt-1">
                  Please select {10 - selectedSkills.length} more skill(s).
                </p>
              )}
              {skills.length < 10 && (
                <p className="text-amber-600 mt-1">
                  You need to add at least {Math.max(0, 10 - skills.length)} more skill(s) to meet the minimum requirement.
                </p>
              )}
            </div>
          </Alert>
          
          {/* Validation message for required skills */}
          {skills.length === 0 && (
            <div className="text-red-500 text-xs mt-1">Please add at least one key skill.</div>
          )}
        </div>
      </div>

      {/* ID Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">ID Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aadhaar">Aadhaar Number</Label>
            <Input 
              id="aadhaar" 
              value={formData.aadhaar}
              onChange={(e) => updateFormData('aadhaar', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number</Label>
            <Input 
              id="pan" 
              value={formData.pan}
              onChange={(e) => updateFormData('pan', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Client Details/Experiences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">Experience
          <Button type="button" size="icon" variant="ghost" onClick={addExperience} className="ml-2"><Plus className="h-4 w-4" /></Button>
        </h3>
        {experiences.map((exp, idx) => (
          <div key={idx} className="border p-4 rounded-md relative space-y-4">
            {/* First row: Client name and dates */}
            <div className="grid grid-cols-6 gap-4 items-end">
              <div className="col-span-2 space-y-2">
                <Label>Client Name</Label>
                <Input value={exp.client} onChange={e => updateExperience(idx, 'client', e.target.value)} placeholder="Client Name" />
              </div>
              <div className="space-y-2">
                <Label>Start Month</Label>
                <Select value={exp.startMonth} onValueChange={val => updateExperience(idx, 'startMonth', val)}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Year</Label>
                <Select value={exp.startYear} onValueChange={val => updateExperience(idx, 'startYear', val)}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Month</Label>
                <Select value={exp.endMonth} onValueChange={val => updateExperience(idx, 'endMonth', val)} disabled={exp.present}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Year</Label>
                <Select value={exp.endYear} onValueChange={val => updateExperience(idx, 'endYear', val)} disabled={exp.present}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Second row: Present checkbox */}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={exp.present} onChange={e => updateExperience(idx, 'present', e.target.checked)} id={`present-${idx}`} />
              <Label htmlFor={`present-${idx}`}>Present</Label>
            </div>
            
            {/* Third row: Job responsibilities */}
            <div className="space-y-2">
              <Label>Job Responsibilities</Label>
              <Textarea 
                value={exp.responsibilities}
                onChange={e => updateExperience(idx, 'responsibilities', e.target.value)}
                placeholder="Describe your key responsibilities, achievements, and job duties..."
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-gray-500">
                This will be auto-filled when you upload a resume with AI processing enabled.
              </div>
            </div>
            
            <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeExperience(idx)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      {/* Education Entries */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">Education
          <Button type="button" size="icon" variant="ghost" onClick={addEducation} className="ml-2"><Plus className="h-4 w-4" /></Button>
        </h3>
        {education.map((edu, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 items-end border p-3 rounded-md relative">
            <div className="col-span-3 space-y-2">
              <Label>Education Level</Label>
              <Select value={edu.educationLevel} onValueChange={val => updateEducation(idx, 'educationLevel', val)}>
                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10th">10th (Secondary)</SelectItem>
                  <SelectItem value="12th">12th (Higher Secondary)</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label>Degree / Course</Label>
              <Input 
                value={edu.degree}
                onChange={e => updateEducation(idx, 'degree', e.target.value)}
                placeholder="Degree or Course"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label>Institution</Label>
              <Input 
                value={edu.institution}
                onChange={e => updateEducation(idx, 'institution', e.target.value)}
                placeholder="Institution Name"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Year of Completion</Label>
              <Select value={edu.year} onValueChange={val => updateEducation(idx, 'year', val)}>
                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeEducation(idx)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="pt-4">
        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : submitButtonText}
        </Button>
      </div>
    </div>
  );
}
