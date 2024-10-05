import { parse, unparse } from 'papaparse';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function cleanName(name) {
  return name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/)[0] || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' });
  }

  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing uploaded files:", err);
        return res.status(500).json({ error: 'Error parsing uploaded files.' });
      }

      const fileKeys = Object.keys(files);
      if (fileKeys.length === 0) {
        return res.status(400).json({ error: 'No CSV files uploaded.' });
      }

      const headers = [
        'First Name',
        'Last Name',
        'Headline',
        'Location',
        'Current Title',
        'Current Company',
        'Email Address',
        'Phone Number',
        'Profile URL',
        'Active Project',
        'Notes',
        'Feedback',
      ];

      let combinedData = [headers];
      let isFirstFile = true;

      for (let key of fileKeys) {
        const file = files[key];
        const fileContent = fs.readFileSync(file.filepath, { encoding: 'utf-8' });
        if (!fileContent) {
          return res.status(500).json({ error: `Could not read file: ${file.originalFilename}` });
        }

        let parsedData;
        try {
          parsedData = parse(fileContent, { header: true, skipEmptyLines: true }).data;
        } catch (parsingError) {
          console.error(`Error parsing file ${file.originalFilename}:`, parsingError.message);
          return res.status(500).json({ error: `Error parsing file: ${file.originalFilename}` });
        }

        const dataToMerge = isFirstFile ? parsedData : parsedData.slice(1);
        isFirstFile = false;

        dataToMerge.forEach((row) => {
          row['First Name'] = cleanName(row['First Name'] || '');
          const rowArray = headers.map((header) => row[header] || '');
          combinedData.push(rowArray);
        });
      }

      const uniqueRows = Array.from(new Set(combinedData.map(JSON.stringify))).map(JSON.parse);
      const cleanedCsv = unparse(uniqueRows);
      res.status(200).json([cleanedCsv]);
    });
  } catch (error) {
    console.error("Error in the handler function:", error);
    res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
}