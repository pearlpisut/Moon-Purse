import React from 'react';

const FileQuotaMeter = ({ STORAGE_QUOTA, totalFileSize }) => {
    const usedPercentage = (totalFileSize / STORAGE_QUOTA) * 100;

    return (
        <div className="mt-6">
            <h2 className="text-lg font-semibold">Storage 💾</h2>
            <div className="w-full mt-3 bg-gray-300 rounded-full h-4">
                <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${usedPercentage}%` }}
                ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
                {totalFileSize.toFixed(2)} / {STORAGE_QUOTA} MB ({usedPercentage.toFixed(2)}%)
            </p>
        </div>
    );
};

export default FileQuotaMeter; 