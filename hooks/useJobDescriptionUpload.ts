import { useState } from 'react';

interface JobDescriptionData {
    jobTitle?: string;
    companyName?: string;
    department?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
        isRemote?: boolean;
        isHybrid?: boolean;
        isOnsite?: boolean;
    };
    jobType?: string;
    experienceLevel?: string;
    experienceRequired?: string;
    salaryRange?: {
        min?: string;
        max?: string;
        currency?: string;
        period?: string;
    };
    description?: string;
    responsibilities?: string[];
    requirements?: {
        education?: string;
        skills?: string[];
        experience?: string;
        certifications?: string[];
    };
    preferredQualifications?: string[];
    benefits?: string[];
    applicationDeadline?: string;
    contactInfo?: {
        email?: string;
        phone?: string;
        person?: string;
    };
    workSchedule?: string;
    travelRequirements?: string;
    industryType?: string;
    companySize?: string;
    jobCode?: string;
    summary?: string;
}

interface JobDescriptionUploadResult {
    success: boolean;
    fileName: string;
    extractedData: JobDescriptionData;
    error?: string;
}

export function useJobDescriptionUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const uploadJobDescription = async (file: File): Promise<JobDescriptionUploadResult> => {
        setIsUploading(true);
        setUploadProgress({ [file.name]: 0 });

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
                }));
            }, 500);

            const response = await fetch('/api/upload-job-description', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress({ [file.name]: 100 });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Job description upload error:', error);
            throw error;
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadProgress({});
            }, 2000);
        }
    };

    return {
        uploadJobDescription,
        isUploading,
        uploadProgress
    };
}
