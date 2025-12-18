import React, { useState, useEffect } from 'react';

function App() {
  const [responsibilityMap, setResponsibilityMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResponsibilityMap = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/responsibility-map');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setResponsibilityMap(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          VishwaGuru
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Civic action, simplified.
        </p>
        <div className="space-y-4 mb-8">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Start an Issue
          </button>
          <button
            onClick={fetchResponsibilityMap}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Who is Responsible?
          </button>
        </div>

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {responsibilityMap && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-xl font-semibold mb-4 text-center">Responsibility Map</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(responsibilityMap).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded shadow-sm border">
                  <h3 className="font-bold text-lg capitalize mb-2">{key.replace('_', ' ')}</h3>
                  <p className="font-medium text-gray-800">{value.authority}</p>
                  <p className="text-sm text-gray-600 mt-1">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
