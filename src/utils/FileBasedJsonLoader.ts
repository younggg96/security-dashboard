import { Vulnerability } from '../interfaces/VulnerabilityData';

/**
 * File-based JSON loader
 * Used for efficiently loading and processing local JSON files
 */
export class FileBasedJsonLoader {
  /**
   * Load JSON data from a local file
   * @param file Local JSON file
   * @param onProgress Progress callback function
   * @returns Parsed raw JSON data
   */
  async loadFromFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      console.log(`Start loading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

      // Set up progress event handler
      fileReader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = event.loaded / event.total;
          console.log(`File loading progress: ${(progress * 100).toFixed(2)}%`);
          onProgress(progress);
        }
      };

      // Set up completion event handler
      fileReader.onload = (event) => {
        try {
          console.log('File reading complete, starting JSON parsing');
          const result = event.target?.result;
          if (typeof result !== 'string') {
            const errorMsg = 'Unable to read file as text';
            console.error(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          // Check file header content to confirm data format
          const previewContent = result.slice(0, 100);
          console.log(`File content preview: ${previewContent}...`);

          try {
            // Parse JSON data
            let jsonData = JSON.parse(result);
            console.log('JSON parsing successful, data type:', typeof jsonData);
            
            // Record JSON structure
            if (Array.isArray(jsonData)) {
              console.log(`Data is an array containing ${jsonData.length} items`);
              if (jsonData.length > 0) {
                console.log('First item example:', JSON.stringify(jsonData[0]).slice(0, 200) + '...');
              }
            } else if (jsonData && typeof jsonData === 'object') {
              console.log('Data is an object with the following properties:', Object.keys(jsonData));
              Object.entries(jsonData).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                  console.log(`Property "${key}" is an array containing ${(value as any[]).length} items`);
                  if ((value as any[]).length > 0) {
                    console.log(`Example of the first item in "${key}":`, JSON.stringify(value[0]).slice(0, 200) + '...');
                  }
                } else if (value && typeof value === 'object') {
                  console.log(`Property "${key}" is an object containing properties:`, Object.keys(value));
                } else {
                  console.log(`Property "${key}" is a primitive type:`, value);
                }
              });
            }

            // Return the raw parsed JSON data without any conversion
            console.log('Successfully parsed JSON data, returning raw data');
            resolve(jsonData);
            
          } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            // Check if it's a Git LFS pointer file
            if (result.trim().startsWith('version https://git-lfs.github.com/spec/v1')) {
              console.error('Detected Git LFS pointer file, cannot parse directly. Actual JSON content is needed, not LFS pointer');
              reject(new Error('The uploaded file is a Git LFS pointer, not actual JSON data. Please upload a valid JSON file.'));
            } else {
              reject(parseError);
            }
          }
        } catch (error) {
          console.error('Error processing file:', error);
          reject(error);
        }
      };

      // Set up error handling
      fileReader.onerror = (event) => {
        console.error('File reading error:', event);
        reject(new Error('Error reading file'));
      };

      // Start reading file
      console.log('Starting to read file as text');
      fileReader.readAsText(file);
    });
  }
} 