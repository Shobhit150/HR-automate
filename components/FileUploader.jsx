'use client';
import { useState } from 'react';
import mammoth from 'mammoth'; // For DOCX parsing

export default function FileUploader({ onTextExtracted }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
   // Keep for potential debugging

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
   

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        // --- PDF Handling ---
        const formData = new FormData();
        formData.append('file', file);

       

        const response = await fetch('/api/pdf1', { // Ensure this API route is correct
          method: 'POST',
          body: formData,
        });

       

        if (!response.ok) {
          // Try to get error details from the response body
          let errorBody = 'Server returned an error.';
          try {
            const errorResult = await response.json();
            errorBody = errorResult.error || JSON.stringify(errorResult);
          } catch (e) {
             // Ignore if response body is not JSON
          }
          throw new Error(`Failed to process PDF: ${response.status} - ${errorBody}`);
        }

        const result = await response.json();
      

        // *** FIX: Use the 'text' field from the server response ***
        if (result.text) {
           extractedText = result.text;
           // Optionally add a note about the upload if needed for UI
           // console.log(`PDF uploaded to: ${result.filePath}`);
        } else if (result.error) {
            // Handle cases where the server indicates an error even with a 200 OK response (e.g., parsing failed server-side)
            throw new Error(`Server error during PDF processing: ${result.error}`);
        }
         else {
            throw new Error('Server response did not contain extracted text.');
        }

      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // --- DOCX Handling (Client-side) ---
      
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
       

      } else {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF or DOCX file.`);
      }

      // Ensure text was actually extracted before calling the callback
      if (onTextExtracted && typeof extractedText === 'string' && extractedText.trim() !== '') {
        onTextExtracted(extractedText);
      } else if (!error) { // Avoid overwriting a specific error
         // If extractedText is empty or not a string, but no specific error was thrown yet
         setError('No text content could be extracted from the document.');
         
      }

    } catch (err) {
      setError(err.message);
      console.error('Error processing file:', err);
      
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX Structure (simplified for clarity, add your styling back) ---
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.docx" // Specify accepted file types
        className="hidden" // Hide the default input, style the label instead
        id="file-upload"
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-gray-500">
          {/* You can add an icon here */}
          <p className="font-semibold">Click to upload or drag and drop</p>
          <p className="text-sm">PDF or DOCX (max 5MB)</p> {/* Adjust max size if needed */}
        </div>
      </label>

      {isLoading && (
        <div className="mt-4 text-sm text-blue-600">
          Processing file...
          {/* Optional: Add a spinner */}
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-100 p-2 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

     
    </div>
  );
}
