import React, { useState } from 'react';
import { Database, Table, X, Eye } from 'lucide-react';

const DatabaseViewer = ({ roomId }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Define available tables per room
  const roomTables = {
    football: [
      { name: 'teams', icon: '⚽', description: 'Football teams data' },
      { name: 'players', icon: '👤', description: 'Player information' },
      { name: 'matches', icon: '🏆', description: 'Match results' }
    ],
    casino: [
      { name: 'slot_machines', icon: '🎰', description: 'Slot machine details' },
      { name: 'players', icon: '👤', description: 'Casino players' },
      { name: 'games', icon: '🎮', description: 'Game history' },
      { name: 'employees', icon: '👨‍💼', description: 'Casino staff' },
      { name: 'suspicious_events', icon: '🚨', description: 'Suspicious activity' }
    ],
    space: [
      { name: 'modules', icon: '🛰️', description: 'Station modules & status' },
      { name: 'crew_members', icon: '👩‍🚀', description: 'Crew assignments' },
      { name: 'system_alerts', icon: '🚨', description: 'Active alerts' },
      { name: 'sensor_readings', icon: '📡', description: 'Live telemetry' },
      { name: 'maintenance_logs', icon: '🛠️', description: 'Maintenance history' }
    ]
  };

  const tables = roomTables[roomId] || [];

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/execute-sql/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `SELECT * FROM ${tableName}` })
      });
      
      const data = await response.json();
      if (data.success) {
        setTableData(data);
        setSelectedTable(tableName);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setSelectedTable(null);
    setTableData(null);
  };

  return (
    <>
      {/* Sidebar Panel */}
      <div className="w-64 bg-gradient-to-b from-gray-900 to-black border-r-4 border-yellow-500 p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-yellow-500/50">
          <Database className="w-8 h-8 text-yellow-400" />
          <h3 className="text-xl font-black text-yellow-400 uppercase">Database</h3>
        </div>

        <div className="space-y-3">
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => fetchTableData(table.name)}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-yellow-900 hover:to-yellow-800 border-2 border-gray-600 hover:border-yellow-500 rounded-lg p-3 transition-all transform hover:scale-105 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{table.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-sm uppercase">{table.name}</div>
                  <div className="text-gray-400 text-xs">{table.description}</div>
                </div>
                <Eye className="w-5 h-5 text-gray-400 group-hover:text-yellow-400" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <div className="text-blue-300 text-xs font-bold mb-2">💡 TIP</div>
          <div className="text-blue-200 text-xs">
            Click on any table to view its contents and structure
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-4 border-yellow-500 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl" style={{
            boxShadow: '0 0 50px rgba(234, 179, 8, 0.5)'
          }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Table className="w-8 h-8 text-white" />
                <h2 className="text-3xl font-black text-white uppercase">{selectedTable}</h2>
              </div>
              <button
                onClick={closePopup}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all transform hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-spin">⏳</div>
                  <div className="text-yellow-400 text-xl font-bold">Loading data...</div>
                </div>
              ) : tableData && tableData.data ? (
                <>
                  {/* Meta Info */}
                  <div className="mb-6 flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="text-yellow-400 font-bold">
                      📊 Total Rows: <span className="text-white">{tableData.row_count}</span>
                    </div>
                    <div className="text-yellow-400 font-bold">
                      📋 Columns: <span className="text-white">{tableData.columns.length}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-lg border-2 border-gray-700">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-yellow-600 to-yellow-700">
                          {tableData.columns.map((column, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-white font-black uppercase text-sm border-r border-yellow-500/30 last:border-r-0">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.data.map((row, rowIdx) => (
                          <tr 
                            key={rowIdx}
                            className={`${rowIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'} hover:bg-yellow-900/30 transition-colors`}
                          >
                            {tableData.columns.map((column, colIdx) => (
                              <td key={colIdx} className="px-4 py-3 text-gray-200 border-r border-gray-700 last:border-r-0 font-mono text-sm">
                                {row[column] !== null ? String(row[column]) : (
                                  <span className="text-gray-500 italic">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-red-400 text-xl font-bold">No data available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default DatabaseViewer;
