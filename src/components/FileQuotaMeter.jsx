import React from 'react';

const FileQuotaMeter = ({ TOTAL_STORAGE_MB, totalFileSize }) => {
    const usedPercentage = (totalFileSize / TOTAL_STORAGE_MB) * 100;

    return (
        <div className="mt-6">
            <h2 className="text-lg font-semibold">Storage Usage</h2>
            <div className="w-full bg-gray-300 rounded-full h-4">
                <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${usedPercentage}%` }}
                ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
                {totalFileSize.toFixed(2)} / {TOTAL_STORAGE_MB} MB ({usedPercentage.toFixed(2)}%)
            </p>
        </div>
    );
};

export default FileQuotaMeter; 