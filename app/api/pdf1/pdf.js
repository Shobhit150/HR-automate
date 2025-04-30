// pdfParserWrapper.js
import pdfParse from 'pdf-parse';

export default function parsePdf(fileBuffer) {
  // Disable the debug mode directly before calling pdf-parse
  // We set the `isDebugMode` to false, so it won't attempt to load the test file

  let isDebugMode = false;  // Disable debug mode

  // Return the result from pdf-parse
  return pdfParse(fileBuffer);
}
