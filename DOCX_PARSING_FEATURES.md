# Enhanced DOCX Document Parsing Features

## Overview
The application now includes robust DOCX document parsing capabilities using the `mammoth` library, with several enhancements for better text extraction and error handling.

## Features Implemented

### 1. **Enhanced File Type Detection**
- Supports both MIME type and file extension validation
- Handles cases where MIME type is incorrectly detected as `application/octet-stream`
- Supports: `.doc`, `.docx`, `.pdf`, `.txt`, `.jpg`, `.jpeg`, `.png`

### 2. **Dual Extraction Method**
- **Raw Text Extraction**: Direct text extraction using `mammoth.extractRawText()`
- **HTML Extraction**: Fallback HTML extraction using `mammoth.convertToHtml()`
- Automatically switches to HTML method if raw text is insufficient

### 3. **Advanced HTML to Text Conversion**
- **Table Support**: Converts HTML tables to readable text with pipe separators
- **Structure Preservation**: Maintains paragraph breaks, headers, and list formatting
- **Entity Decoding**: Properly handles HTML entities (`&nbsp;`, `&amp;`, etc.)
- **Whitespace Normalization**: Cleans up excessive whitespace and line breaks

### 4. **Robust Error Handling**
- **Document Validation**: Checks for minimum text length to detect corrupted files
- **Specific Error Messages**: Different error messages for different failure types:
  - Corrupted or invalid documents
  - Empty documents
  - Generic parsing failures
- **Detailed Logging**: Comprehensive logging for debugging document parsing issues

### 5. **AI Processing Integration**
- **Circuit Breaker Pattern**: Prevents repeated API calls when AI service is overloaded
- **Retry Logic**: Exponential backoff for temporary AI service failures
- **Fallback Support**: Graceful degradation when AI processing fails

## Usage

### For Users
1. Upload DOCX files through the resume upload interface
2. System automatically extracts text and processes with AI
3. Form fields are auto-populated based on extracted content
4. Manual editing available if AI processing fails

### For Developers
The enhanced parsing logic is in `/app/api/upload-resume/route.ts`:

```typescript
// Enhanced DOCX processing
const [textResult, htmlResult] = await Promise.all([
  mammoth.extractRawText({ buffer }),
  mammoth.convertToHtml({ buffer })
]);

// Fallback to HTML if raw text is insufficient
if (textContent.length < 100 && htmlContent.length > textContent.length) {
  // Advanced HTML to text conversion with table support
  textContent = htmlContent
    .replace(/<table[^>]*>/g, '\\n')
    .replace(/<tr[^>]*>/g, '\\n')
    .replace(/<td[^>]*>/g, ' | ')
    // ... additional processing
}
```

## Testing

Run the test script to verify parsing functionality:
```bash
node test-docx-parsing.js
```

## Supported Document Formats

| Format | Extension | MIME Type | Notes |
|--------|-----------|-----------|-------|
| Word 2007+ | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | Full support with table parsing |
| Word 97-2003 | .doc | application/msword | Basic support |
| PDF | .pdf | application/pdf | Direct AI processing |
| Text | .txt | text/plain | Direct text processing |
| Images | .jpg, .jpeg, .png | image/* | Direct AI processing |

## Error Recovery

The system includes multiple layers of error recovery:

1. **File Type Fallback**: If MIME type fails, check file extension
2. **Extraction Method Fallback**: If raw text fails, try HTML extraction
3. **AI Processing Fallback**: If AI fails, allow manual form entry
4. **Circuit Breaker**: Prevent system overload during AI service issues

## Performance Considerations

- **Concurrent Processing**: Uses `Promise.all()` for parallel text and HTML extraction
- **Memory Efficient**: Processes files in streams where possible
- **Timeout Handling**: Includes timeouts for long-running operations
- **Logging**: Comprehensive but non-blocking logging for debugging

## Future Enhancements

Potential improvements for future versions:
- Support for additional document formats (RTF, ODT)
- Advanced table structure parsing
- Image text extraction (OCR) for embedded images
- Document metadata extraction
- Batch document processing capabilities
