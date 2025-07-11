'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, X, Plus, CheckCircle, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function UploadResumePage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Experiences state
  const [experiences, setExperiences] = useState([
    { client: "", startMonth: "", startYear: "", endMonth: "", endYear: "", present: false }
  ]);
  
  // Education state
  const [education, setEducation] = useState([
    { degree: "", year: "" }
  ]);
  
  // Reference details state
  const [references, setReferences] = useState([
    { name: "", designation: "", email: "", phone: "" }
  ]);
  
  // Other documents state
  const [otherDocs, setOtherDocs] = useState([
    { type: "", name: "", file: null as File | null }
  ]);

  // Main form data - exact same structure as AddResumeModal
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

  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const { uploadSingleFile, isUploading, uploadProgress } = useFileUpload();

  // Form validation function - exact same as AddResumeModal
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

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof typeof formData]) {
        missingFields.push(label);
      }
    }

    if (skills.length === 0) {
      missingFields.push('Technical Skills');
    }

    return missingFields;
  };

  // Helper functions for parsing resume data - exact same as AddResumeModal
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return { month: '', year: '' };
    
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
    let month = '';
    let year = '';
    
    for (const [monthName, monthIndex] of Object.entries(monthMapping)) {
      if (lowerStr.includes(monthName)) {
        month = monthAbbr[monthIndex];
        break;
      }
    }
    
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) {
      year = yearMatch[0];
    }
    
    return { month, year };
  };

  const parseTenureString = (tenure: string) => {
    if (!tenure) return { startMonth: '', startYear: '', endMonth: '', endYear: '', present: false };
    
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

  // Resume upload handler with AI processing - exact same as AddResumeModal
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus({ status: 'uploading', message: 'Processing resume with AI...' });

    try {
      const result = await uploadSingleFile(file);
      
      if (result.success && result.extractedData) {
        const data = result.extractedData;
        
        console.log('AI Extracted Data:', data);
        
        // Format DOB to work with date input if present
        let formattedDob = '';
        if (data.dob) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) {
            formattedDob = data.dob;
          } else {
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
          jobTitle: data.experience?.[0]?.position || prev.jobTitle,
          summary: data.summary || prev.summary,
          dob: formattedDob || prev.dob,
          city: data.location?.city || data.contactDetails?.address?.split(',')[0] || prev.city,
          state: data.location?.state || data.contactDetails?.address?.split(',')[1]?.trim() || prev.state,
          country: data.location?.country || prev.country,
        }));

        // Auto-fill skills
        if (data.skills && data.skills.length > 0) {
          console.log('Auto-filling skills:', data.skills);
          setSkills(data.skills);
        }

        // Auto-fill experience
        if (data.experience && data.experience.length > 0) {
          const mappedExperiences = data.experience.map((exp: any) => {
            let expData = {
              client: exp.company || '',
              startMonth: exp.startMonth || '',
              startYear: exp.startYear || '',
              endMonth: exp.endMonth || '',
              endYear: exp.endYear || '',
              present: exp.isCurrentJob || false
            };
            
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

        // Auto-fill education
        if (data.education && data.education.length > 0) {
          const mappedEducation = data.education.map((edu: any) => {
            let degree = '';
            let year = '';
            
            if (edu.degree && edu.field) {
              degree = `${edu.degree} in ${edu.field}`;
            } else if (edu.degree) {
              degree = edu.degree;
            }
            
            if (edu.institution && !degree.includes(edu.institution)) {
              degree = degree ? `${degree} from ${edu.institution}` : edu.institution;
            }
            
            year = edu.year || edu.endYear || edu.startYear || '';
            
            if (year && !/^\d{4}$/.test(year)) {
              const yearMatch = year.match(/\d{4}/);
              if (yearMatch) {
                year = yearMatch[0];
              }
            }
            
            if (!year) {
              for (const prop in edu) {
                if (typeof edu[prop] === 'string') {
                  const yearMatch = edu[prop].match(/\d{4}/g);
                  if (yearMatch && yearMatch.length > 0) {
                    year = yearMatch[yearMatch.length - 1];
                    break;
                  }
                }
              }
            }
            
            console.log('Mapped education:', { degree, year });
            return { degree, year };
          });
          setEducation(mappedEducation);
        }

        setUploadStatus({ 
          status: 'success', 
          message: `Resume processed successfully! Auto-filled ${
            data.experience?.length || 0
          } experience entries, ${
            data.education?.length || 0
          } education entries, and ${
            data.certifications?.length || 0
          } certifications.`
        });
      } else {
        setUploadStatus({ 
          status: 'error', 
          message: result.error || 'Failed to process resume. Please try again.' 
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

  // Form field update handler
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Experience handlers
  const addExperience = () => setExperiences([...experiences, { client: "", startMonth: "", startYear: "", endMonth: "", endYear: "", present: false }]);
  const removeExperience = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));
  const updateExperience = (idx: number, field: string, value: any) => {
    setExperiences(experiences.map((exp, i) => i === idx ? { ...exp, [field]: value } : exp));
  };

  // Education handlers
  const addEducation = () => setEducation([...education, { degree: "", year: "" }]);
  const removeEducation = (idx: number) => setEducation(education.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, field: string, value: any) => {
    setEducation(education.map((edu, i) => i === idx ? { ...edu, [field]: value } : edu));
  };

  // Reference handlers
  const addReference = () => setReferences([...references, { name: "", designation: "", email: "", phone: "" }]);
  const removeReference = (idx: number) => setReferences(references.filter((_, i) => i !== idx));
  const updateReference = (idx: number, field: string, value: any) => {
    setReferences(references.map((ref, i) => i === idx ? { ...ref, [field]: value } : ref));
  };

  // Other document handlers
  const addOtherDoc = () => setOtherDocs([...otherDocs, { type: "", name: "", file: null }]);
  const removeOtherDoc = (idx: number) => setOtherDocs(otherDocs.filter((_, i) => i !== idx));
  const updateOtherDoc = (idx: number, field: string, value: any) => {
    setOtherDocs(otherDocs.map((doc, i) => i === idx ? { ...doc, [field]: value } : doc));
  };

  // Save handler
  const handleSave = async () => {
    setIsSubmitting(true);
    
    // Validate required fields
    const missingFields = validateRequiredFields();
    if (missingFields.length > 0) {
      setUploadStatus({
        status: 'error',
        message: `Please fill the following required fields: ${missingFields.join(', ')}`
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // TODO: Connect to API endpoint for saving candidate data
      console.log('Submitting candidate profile:', { 
        formData, 
        skills, 
        experiences, 
        education,
        references,
        otherDocs 
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus({
        status: 'success',
        message: 'Profile completed successfully! Redirecting to interview status...'
      });
      
      // Redirect to interview status
      setTimeout(() => {
        router.push('/candidate/interview-status');
      }, 1000);
    } catch (error) {
      console.error('Submission error:', error);
      setUploadStatus({
        status: 'error',
        message: 'Failed to save your profile. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper variables
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const years = Array.from({ length: 50 }, (_, i) => `${new Date().getFullYear() - i}`);

  // State and city options
  const stateOptions = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry", "Jammu and Kashmir", "Ladakh"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Upload your resume and fill in any missing information to get started
          </p>
        </div>

        <Card className="max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Add New Resume</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 py-4">
              {/* Documents - with AI processing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Documents</h3>
                
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume (AI Processing Enabled)</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idDoc">ID Document</Label>
                    <Input id="idDoc" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                    <Label htmlFor="jobTitle">Job Title<span className="text-red-500">*</span></Label>
                    <Input 
                      id="jobTitle" 
                      required 
                      value={formData.jobTitle}
                      onChange={(e) => updateFormData('jobTitle', e.target.value)}
                    />
                  </div>
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
                      <SelectTrigger>
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
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Technical Skills<span className="text-red-500">*</span></h3>
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
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} variant="secondary">
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {/* Validation message for required skills */}
                  {skills.length === 0 && (
                    <div className="text-red-500 text-xs mt-1">Please add at least one technical skill.</div>
                  )}
                </div>
              </div>

              {/* ID Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">ID Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                    <Input id="aadhaar" value={formData.aadhaar} onChange={(e) => updateFormData('aadhaar', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input id="pan" value={formData.pan} onChange={(e) => updateFormData('pan', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uan">UAN Number</Label>
                    <Input id="uan" value={formData.uan} onChange={(e) => updateFormData('uan', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Client Details/Experiences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">Client Details / Experiences
                  <Button type="button" size="icon" variant="ghost" onClick={addExperience} className="ml-2"><Plus className="h-4 w-4" /></Button>
                </h3>
                {experiences.map((exp, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-4 items-end border p-3 rounded-md relative">
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
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={exp.present} onChange={e => updateExperience(idx, 'present', e.target.checked)} id={`present-${idx}`} />
                      <Label htmlFor={`present-${idx}`}>Present</Label>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeExperience(idx)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Education Entries */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">Education / Certificates
                  <Button type="button" size="icon" variant="ghost" onClick={addEducation} className="ml-2"><Plus className="h-4 w-4" /></Button>
                </h3>
                {education.map((edu, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-4 items-end border p-3 rounded-md relative">
                    <div className="col-span-4 space-y-2">
                      <Label>Degree / Course</Label>
                      <Input value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="Degree or Course" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Year</Label>
                      <Select value={edu.year} onValueChange={val => updateEducation(idx, 'year', val)}>
                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>
                          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeEducation(idx)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Reference Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">Reference Details
                  <Button type="button" size="icon" variant="ghost" onClick={addReference} className="ml-2"><Plus className="h-4 w-4" /></Button>
                </h3>
                {references.map((ref, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 items-end border p-3 rounded-md relative">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={ref.name} onChange={e => updateReference(idx, 'name', e.target.value)} placeholder="Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input value={ref.designation} onChange={e => updateReference(idx, 'designation', e.target.value)} placeholder="Designation" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={ref.email} onChange={e => updateReference(idx, 'email', e.target.value)} placeholder="Email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={ref.phone} onChange={e => updateReference(idx, 'phone', e.target.value)} placeholder="Phone Number" />
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeReference(idx)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Other Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">Other Documents
                  <Button type="button" size="icon" variant="ghost" onClick={addOtherDoc} className="ml-2"><Plus className="h-4 w-4" /></Button>
                </h3>
                {otherDocs.map((doc, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 items-end border p-3 rounded-md relative">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={doc.type} onValueChange={val => updateOtherDoc(idx, 'type', val)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Skill Matrix">Skill Matrix</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {doc.type === 'Others' && (
                      <div className="space-y-2">
                        <Label>Document Name</Label>
                        <Input value={doc.name} onChange={e => updateOtherDoc(idx, 'name', e.target.value)} placeholder="Document Name" />
                      </div>
                    )}
                    <div className="space-y-2 col-span-2">
                      <Label>Upload File</Label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>+ Select File</span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => updateOtherDoc(idx, 'file', e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                        />
                        {doc.file && <span className="text-xs text-gray-600 ml-2">{doc.file.name}</span>}
                      </label>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeOtherDoc(idx)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Employer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Job Seeker's Employer Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employerName">Employer Name</Label>
                    <Input id="employerName" placeholder="Employer Name" value={formData.employerName} onChange={(e) => updateFormData('employerName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiterName">Recruiter Name</Label>
                    <Input id="recruiterName" placeholder="Recruiter Name" value={formData.recruiterName} onChange={(e) => updateFormData('recruiterName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiterEmail">Recruiter E-mail</Label>
                    <Input id="recruiterEmail" placeholder="Recruiter E-mail" value={formData.recruiterEmail} onChange={(e) => updateFormData('recruiterEmail', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiterContact">Recruiter Contact Number</Label>
                    <Input id="recruiterContact" placeholder="Recruiter Contact Number" value={formData.recruiterContact} onChange={(e) => updateFormData('recruiterContact', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => router.push('/candidate')}>
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
                onClick={handleSave}
              >
                {isSubmitting ? 'Processing...' : 'Save Resume'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
