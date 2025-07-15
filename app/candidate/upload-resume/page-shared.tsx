'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { ResumeForm } from '@/components/shared/ResumeForm';

export default function UploadResumePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Submit the data
      console.log('Form data:', data.formData);
      console.log('All Skills:', data.skills);
      console.log('Selected Skills (10):', data.selectedSkills);
      console.log('Experiences:', data.experiences);
      console.log('Education:', data.education);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadStatus({
        status: 'success',
        message: 'Resume uploaded successfully! You can now apply for jobs.'
      });

      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push('/candidate/dashboard');
      }, 2000);

    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Failed to upload resume. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Upload Your Resume</CardTitle>
              <CardDescription className="text-gray-600">
                Fill in your details or upload your resume for AI-powered auto-filling
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Upload Status Alert */}
          {uploadStatus.status !== 'idle' && (
            <Alert className={`mb-6 ${uploadStatus.status === 'error' ? 'border-red-200 bg-red-50' : 
                             uploadStatus.status === 'success' ? 'border-green-200 bg-green-50' : 
                             'border-blue-200 bg-blue-50'}`}>
              <div className="flex items-center gap-2">
                {uploadStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {uploadStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Resume Form */}
          <Card>
            <CardContent className="p-6">
              <ResumeForm
                onSubmit={handleSubmit}
                submitButtonText={isSubmitting ? 'Uploading Resume...' : 'Upload Resume'}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
