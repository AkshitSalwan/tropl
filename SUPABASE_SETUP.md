# Supabase Storage Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to initialize

### 2. Get API Keys
1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the **Project URL** 
3. Copy the **service_role** key (NOT the anon key)

### 3. Add Environment Variables
Add these to your `.env` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Name: `resumes`
4. Set as **Public bucket** (if you want direct file access)

### 5. Set Storage Policies (Optional)
If you want to control access, you can set up Row Level Security policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow upload for authenticated users" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes');

-- Allow public read access to files
CREATE POLICY "Allow public read access" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'resumes');
```

## 📁 File Structure
Files will be stored directly in the bucket root with this naming:
```
resumes/
  ├── {userId}_{timestamp}_{filename}
  ├── {userId}_{timestamp}_{filename}
  └── {userId}_{timestamp}_{filename}
```
Example: `66a1b2c3d4e5f6789_1752920905123_john_doe_resume.pdf`

## ✅ Features
- ✅ Automatic file uploads to Supabase Storage
- ✅ Unique file naming to prevent conflicts
- ✅ File type validation (PDF, DOC, DOCX, TXT, JPG, PNG)
- ✅ File size validation (10MB limit)
- ✅ Database record for each uploaded file
- ✅ Public URLs for file access
- ✅ User-specific file organization

## 🔧 Benefits over Local Storage
- ✅ No server disk space usage
- ✅ Scalable storage
- ✅ Built-in CDN
- ✅ Automatic backups
- ✅ File versioning
- ✅ Direct client uploads (future enhancement)
- ✅ Global file accessibility

## 🚨 Important Notes
- The **service_role** key has admin access - keep it secure
- Files are saved directly in the bucket root with userId prefix for organization
- File names are timestamped and prefixed with userId to prevent conflicts
- Public bucket means files are accessible via direct URLs

## 🧪 Testing
After setup, test by:
1. Uploading a resume through your app
2. Check the Supabase Storage dashboard
3. Verify the file appears in the `resumes` bucket
4. Check that the database record is created correctly
