import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// File upload utility functions
export const uploadFileToSupabase = async (
  file: File, 
  bucket: string, 
  filePath: string
): Promise<{ url: string; error?: string }> => {
  try {
    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer()
    
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true // Replace file if it already exists
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return { url: '', error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl }
  } catch (error) {
    console.error('File upload error:', error)
    return { url: '', error: 'Failed to upload file' }
  }
}

export const deleteFileFromSupabase = async (
  bucket: string, 
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('File delete error:', error)
    return { success: false, error: 'Failed to delete file' }
  }
}

// Generate unique file path
export const generateFilePath = (userId: string, originalFileName: string): string => {
  const timestamp = Date.now()
  const fileExtension = originalFileName.split('.').pop()
  const sanitizedFileName = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\s+/g, '_')
  
  // Save directly in bucket root with userId prefix for uniqueness
  return `${userId}_${timestamp}_${sanitizedFileName}`
}
