import React, { useState, useEffect } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [cleanedCsvs, setCleanedCsvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection and store the files in state
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const isValid = selectedFiles.every(file => file.type === 'text/csv');
    if (!isValid) {
      alert("Please upload only CSV files.");
      return;
    }
    setFiles(selectedFiles);
    setError(null);
  };

  // Handle CSV upload and cleaning
  const handleFileUpload = async () => {
    if (files.length === 0) return alert("Please upload at least one CSV file.");
    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    try {
      const response = await fetch('/api/clean-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to clean CSV files.");

      const results = await response.json();
      const cleanedUrls = results.map((result, index) =>
        URL.createObjectURL(new Blob([result], { type: 'text/csv' }))
      );

      setCleanedCsvs(cleanedUrls);
      setFiles([]);
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanedCsvs.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cleanedCsvs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">CSV Cleaner</h1>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          multiple
          className="mb-4 w-full p-2 border border-gray-300 rounded"
        />
        <button 
          onClick={handleFileUpload}
          disabled={loading}
          className={`w-full ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded transition duration-300`}
        >
          {loading ? 'Cleaning CSV(s)...' : 'Upload & Clean CSV(s)'}
        </button>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {cleanedCsvs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-center">Download Cleaned CSV(s)</h3>
            {cleanedCsvs.map((csv, index) => (
              <a 
                key={index}
                href={csv} 
                download={`cleaned_${index + 1}.csv`}
                className="block w-full text-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2 transition duration-300"
              >
                Download Cleaned CSV {index + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
