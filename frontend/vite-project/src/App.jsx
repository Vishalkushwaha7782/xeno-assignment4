import axios from "axios";
import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);

  const [validationResults, setValidationResults] = useState({
    validRows: 0,
    invalidRows: 0,
    errors: [],
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
      );

      setValidationResults(response.data);

      alert("File uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("File upload failed");
    }
  };

  const handleDownload = () => {
    window.open("http://localhost:5000/download-clean-csv", "_blank");
  };

  const totalRows = validationResults.validRows + validationResults.invalidRows;

  const successRate =
    totalRows === 0
      ? 0
      : ((validationResults.validRows / totalRows) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-slate-800">
            CSV Validator Dashboard
          </h1>

          <p className="text-slate-500 mt-3 text-lg">
            Upload, Validate and Download Clean Data
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-14 text-center hover:shadow-lg transition-all">
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="text-7xl mb-4">📁</div>

              <h3 className="text-2xl font-bold text-slate-700">
                Click Here To Select CSV File
              </h3>

              <p className="text-slate-500 mt-2">
                Upload your transaction dataset
              </p>

              {file && (
                <div className="mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  ✅ {file.name}
                </div>
              )}
            </label>

            <input
              id="fileUpload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-6">
              <button
                onClick={handleUpload}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Upload CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-slate-500 font-medium">Total Rows</h3>

            <p className="text-3xl font-bold mt-2">{totalRows}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl shadow-md p-6">
            <h3 className="text-green-700 font-medium">Valid Rows</h3>

            <p className="text-3xl font-bold mt-2">
              {validationResults.validRows}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-md p-6">
            <h3 className="text-red-700 font-medium">Invalid Rows</h3>

            <p className="text-3xl font-bold mt-2">
              {validationResults.invalidRows}
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl shadow-md p-6">
            <h3 className="text-indigo-700 font-medium">Success Rate</h3>

            <p className="text-3xl font-bold mt-2">{successRate}%</p>
          </div>
        </div>

        {/* Error Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-5">Validation Errors</h2>

          {validationResults.errors.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
              No errors found 🎉
            </div>
          ) : (
            <div className="overflow-hidden border rounded-xl">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4">Error Details</th>
                  </tr>
                </thead>

                <tbody>
                  {validationResults.errors.map((error, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4 text-red-600">❌ {error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Data Quality Summary</h2>

          <div className="space-y-2 text-slate-700">
            <p>📊 Total Records Processed: {totalRows}</p>

            <p>✅ Valid Records: {validationResults.validRows}</p>

            <p>❌ Invalid Records: {validationResults.invalidRows}</p>

            <p>🎯 Validation Success Rate: {successRate}%</p>
          </div>
        </div>

        {/* Download Button */}
        <div className="text-center">
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition shadow-md"
          >
            Download Clean CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
