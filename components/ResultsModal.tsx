'use client';
import { M3Colors } from '@/constants/themeConstants';
import { ResultsModalProps } from '@/types';
import React from 'react';

const ResultsModal: React.FC<ResultsModalProps> = ({ results, onClose }) => {
  return (
    <div
      className={`fixed inset-0 ${M3Colors.surfaceContainer} bg-opacity-75 flex items-center justify-center z-50 p-4`}
      aria-labelledby="results-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className={`${M3Colors.surface} rounded-2xl ${M3Colors.shadow} max-w-xl w-full flex flex-col ${M3Colors.onSurface} overflow-hidden`}>
        <div className={`p-6 border-b ${M3Colors.outline}`}>
          <h2 id="results-modal-title" className={`text-2xl font-semibold ${M3Colors.onSurface}`}>
            Analysis Results
          </h2>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className={`${M3Colors.secondaryContainer}`}>
              <tr>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Point #
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Test Type
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Concentration
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Remark
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${M3Colors.outline} ${M3Colors.surface}`}>
              {results.map((result) => (
                <tr key={`${result.pointIndex}-${result.test_type}-${result.concentration}`}>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.pointIndex}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.test_type}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.concentration.toFixed(2)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`p-6 border-t ${M3Colors.outline} flex justify-end`}>
          <button
            onClick={onClose}
            className={`${M3Colors.primary} ${M3Colors.onPrimary} font-medium py-2.5 px-6 rounded-full text-sm transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
