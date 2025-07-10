import { useState } from 'react';

interface ExtractedData {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    contactDetails?: {
        address?: string;
        linkedin?: string;
        github?: string;
        website?: string;
        twitter?: string;
    };
    socialLinks?: string[];
    experience?: Array<{
        company: string;
        position: string;
        tenure: string;
        startMonth?: string;
        startYear?: string;
        endMonth?: string;
        endYear?: string;
        isCurrentJob?: boolean;
        description: string;
        skills: string[];
    }>;
    projects?: Array<{
        name: string;
        link?: string;
        description: string;
        skills: string[];
    }>;
    skills?: string[];
    education?: Array<{
        institution: string;
        degree: string;
        field: string;
        year: string;
        startYear?: string;
        endYear?: string;
        score?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuer: string;
        date: string;
    }>;
    summary?: string;
}

interface UploadResult {
    success: boolean;
    fileName: string;
    filePath: string;
    extractedData: ExtractedData;
    error?: string;
    aiProcessed?: boolean;
    message?: string;
}

export function useFileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const uploadSingleFile = async (file: File): Promise<UploadResult> => {
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

            const response = await fetch('/api/upload-resume', {
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
            console.error('Upload error:', error);
            throw error;
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadProgress({});
            }, 2000);
        }
    };

    const uploadMultipleFiles = async (files: File[]): Promise<UploadResult[]> => {
        setIsUploading(true);
        const results: UploadResult[] = [];

        // Initialize progress for all files
        const initialProgress: { [key: string]: number } = {};
        files.forEach(file => {
            initialProgress[file.name] = 0;
        });
        setUploadProgress(initialProgress);

        try {
            // Upload files concurrently using Promise.all and map
            const uploadPromises = files.map(async (file) => {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    // Individual progress tracking for concurrent uploads
                    const progressInterval = setInterval(() => {
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: Math.min((prev[file.name] || 0) + 5, 90)
                        }));
                    }, 300);

                    const response = await fetch('/api/upload-resume', {
                        method: 'POST',
                        body: formData,
                    });

                    clearInterval(progressInterval);
                    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Upload failed');
                    }

                    const result = await response.json();
                    return result;
                } catch (error) {
                    return {
                        success: false,
                        fileName: file.name,
                        filePath: '',
                        extractedData: {},
                        error: error instanceof Error ? error.message : 'Upload failed'
                    };
                }
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadProgress({});
            }, 2000);
        }
    };

    return {
        uploadSingleFile,
        uploadMultipleFiles,
        isUploading,
        uploadProgress
    };
}
