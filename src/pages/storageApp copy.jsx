import { useState, useEffect } from "react";
import axios from "axios";
import { ethers, BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

function StorageApp() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("No file selected");
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [currentWallet, setCurrentWallet] = useState("");

    // Add useEffect to get wallet address when component mounts
    useEffect(() => {
        const getWalletAddress = async () => {
            try {
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setCurrentWallet(address);
            } catch (error) {
                console.error("Error getting wallet address:", error);
            }
        };

        getWalletAddress();
    }, []);

    // Add useEffect to load files when component mounts
    useEffect(() => {
        loadUserFiles();
    }, []);  // Empty dependency array means this runs once on mount

    // Function to handle file upload to Pinata and smart contract
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        try {
            setUploading(true);

            // 1. Upload to Pinata
            const formData = new FormData();
            formData.append("file", file);

            const resFile = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
                    pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
                    "Content-Type": "multipart/form-data",
                },
            });

            const ipfsHash = resFile.data.IpfsHash;

            // 2. Store in smart contract with explicit network handling
            const provider = new BrowserProvider(window.ethereum);
            
            // Wait for provider to be ready
            await provider.ready;

            const signer = await provider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            console.log("Sending transaction...");
            const tx = await contract.addFile(ipfsHash, fileName);
            console.log("Transaction sent:", tx.hash);
            
            // Wait for one confirmation
            const receipt = await tx.wait(1);
            console.log("Transaction confirmed:", receipt);

            // Reset form
            setFileName("No file selected");
            setFile(null);
            
            // Refresh files list
            await loadUserFiles();

        } catch (error) {
            console.error("Error uploading file:", error);
            if (error.message.includes("block tag")) {
                alert("Network sync error. Please reset your MetaMask account and try again.");
            } else {
                alert(error.message || "Failed to upload file");
            }
        } finally {
            setUploading(false);
        }
    };

    // Function to load files from Pinata
    const loadUserFiles = async () => {
        try {
            // 1. Get and verify current wallet
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();
            console.log("Current wallet address:", walletAddress);

            // 2. Get files from contract for this wallet
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );
            const contractFiles = await contract.getUserFiles();

            // 3. Filter existing files and create hash set
            const validHashes = new Set(
                contractFiles.filter(file => file.exists).map(file => file.ipfsHash)
            );

            // 4. Get and filter Pinata files
            const response = await axios.get(
                'https://api.pinata.cloud/data/pinList?status=pinned',
                {
                    headers: {
                        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
                        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
                    }
                }
            );

            const pinataFiles = response.data.rows
                .filter(pin => validHashes.has(pin.ipfs_pin_hash)) // check if users owns the file
                .map(pin => ({
                    fileName: pin.metadata?.name || 'Unnamed File',
                    ipfsHash: pin.ipfs_pin_hash,
                    size: pin.size,
                    uploadTime: new Date(pin.date_pinned).getTime(),
                    exists: true
                }));

            console.log("Final filtered files:", pinataFiles);
            setFiles(pinataFiles);

        } catch (error) {
            console.error("Error in loadUserFiles:", error);
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    // Add this new function in your StorageApp component
    const handleDeleteFile = async (fileIndex, ipfsHash) => {
        try {
            setUploading(true); // Reuse the loading state

            // 1. Delete from smart contract
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            const tx = await contract.deleteFile(fileIndex);
            await tx.wait();

            // 2. Delete from Pinata
            try {
                await axios.delete(
                    `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
                    {
                        headers: {
                            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
                            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
                        },
                    }
                );
            } catch (pinataError) {
                console.error("Error unpinning from Pinata:", pinataError);
                // Continue even if Pinata deletion fails
            }

            // 3. Refresh the file list
            await loadUserFiles();

        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete file");
        } finally {
            setUploading(false);
        }
    };

    // Add this helper function
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-[1200px] bg-white shadow-md rounded-lg min-h-[800px] p-6">
        <div>
            <h1 className="text-xl font-title text-neutral-950">File Storage</h1>
            <p className="text-sm text-gray-500 mt-1">
                Connected Wallet: {currentWallet ? 
                    `${currentWallet.slice(0, 6)}...${currentWallet.slice(-4)}` : 
                    'Not Connected'}
            </p>
        </div>
        <div className="container mx-auto p-4">
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col gap-4">
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        className="border p-2 rounded"
                    />
                    <span>Selected: {fileName}</span>
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    >
                        {uploading ? "Uploading..." : "Upload File"}
                    </button>
                </div>
            </form>

            {/* Display files */}
            {/* column name */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-neutral-200">
              <span className="col-span-1 flex items-center justify-center text-sm text-neutral-500">Select</span>
              <span className="col-span-5 text-sm text-neutral-500">File Name</span>
              <span className="col-span-3 text-sm text-neutral-500">Upload Time</span>
              <span className="col-span-2 text-sm text-neutral-500">Shared</span>
              <span className="col-span-1 text-sm text-neutral-500">Actions</span>
            </div>
            <div className="flex flex-col space-y-4 mt-4">
                    {files.map((file, index) => {
                        return (
                            <div key={index} className="grid grid-cols-12 items-center py-3 px-4 bg-neutral-50 rounded-md">
                                <div className="col-span-1 flex items-center justify-center">
                                    <input type="checkbox" className="w-[20px] h-[20px] rounded-full text-blue-800 focus:ring-blue-800" />
                                </div>
                                <span className="col-span-5 text-neutral-950">{file.fileName}</span>
                                <span className="col-span-3 text-neutral-500">
                                    {file.uploadTime ? new Date(file.uploadTime).toLocaleString() : 'Unknown'}
                                </span>
                                <span className="col-span-2 text-neutral-500">
                                    {file.size ? formatFileSize(file.size) : 'Unknown'}
                                </span>
                                <div className="col-span-1 flex gap-2">
                                    <a
                                        href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm"
                                    >
                                        Open
                                    </a>
                                    <button
                                        onClick={() => handleDeleteFile(index, file.ipfsHash)}
                                        className="btn btn-error btn-sm"
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
              </div>
            </div>
            {/* shows when deleting fails */}
            {deleteError && (
                <div className="alert alert-error mb-4">
                    {deleteError}
                    <button 
                        onClick={() => setDeleteError(null)}
                        className="ml-auto"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
      </div>
    );
}

export default StorageApp;
