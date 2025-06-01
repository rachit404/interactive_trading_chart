import React from "react";

const Table = ({ data }) => {
  return (
    <>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Binance Data</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300">
            <thead className="bg-gray-100 text-gray-700 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Open</th>
                <th className="px-4 py-2 border">High</th>
                <th className="px-4 py-2 border">Low</th>
                <th className="px-4 py-2 border">Close</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 border">{item.time}</td>
                  <td className="px-4 py-2 border">{item.open}</td>
                  <td className="px-4 py-2 border">{item.high}</td>
                  <td className="px-4 py-2 border">{item.low}</td>
                  <td className="px-4 py-2 border">{item.close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Table;
