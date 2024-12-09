import { useState, useEffect } from "react";
import axios from "axios";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

// our components and utilities
import FileQuotaMeter from "../components/FileQuotaMeter";
import { downloadImage, formatFileSize } from '../utils/utilFunctions';

function StorageApp() {
    const [files, setFiles] = useState([]); // all current user's files fetched from backend
    // const [file, setFile] = useState(null); // file being uploaded
    // const [fileName, setFileName] = useState("No file selected"); // such file's name

    // for UI purpose
    const [uploading, setUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentWallet, setCurrentWallet] = useState("");
    const [totalFileSize, setTotalFileSize] = useState(0);
    const [activeTab, setActiveTab] = useState("myFiles");
        
    const STORAGE_QUOTA = 500;

    // update total file size after new files added
    useEffect(() => {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        setTotalFileSize(totalSize/(1024*1024));
    }, [files]);

    // update the current wallet address logged-in
    // Function to get current wallet address
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

    // Get initial wallet address on mount
    useEffect(() => {
        getWalletAddress();

        // Listen for account changes
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setCurrentWallet(accounts[0]); // Update state with new account
            } else {
                setCurrentWallet(""); // No accounts connected
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Cleanup listener on component unmount
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
    }, []);

    // update the current list of files
    useEffect(() => {
        loadUserFiles();
    }, [currentWallet, activeTab]);
    
    // Function to handle file upload to Pinata and smart contract
    const handleSubmit = async (selectedFile) => {
        // e.preventDefault();
        if (!selectedFile) {
            console.log("weird")
            return;
        }
        try {
            setUploading(true);

            // 1. Upload to Pinata
            const formData = new FormData();
            console.log("from handleSubmit: ", selectedFile.name)
            formData.append("file", selectedFile);
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
            const tx = await contract.addFile(ipfsHash, selectedFile.name);
            console.log("Transaction sent:", tx.hash);
            
            // Wait for one confirmation
            const receipt = await tx.wait(1);
            console.log("Transaction confirmed:", receipt);

            // Reset form
            // setFileName("No file selected");
            // setFile(null);
            
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
            var contractFiles = await contract.getUserFiles();

            // 3. Filter existing files and create hash set
            if(activeTab == 'deletedFiles') 
                contractFiles = contractFiles.filter(file => !file.exists);
            else 
                contractFiles = contractFiles.filter(file => file.exists);

            const validHashes = new Set(
                contractFiles.map(file => file.ipfsHash)
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

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // setFile(selectedFile);
            // setFileName(selectedFile.name);
            console.log("prepare to upload: ", selectedFile.name)
            handleSubmit(selectedFile)
        }
    };

    const handlePermanentlyDeleteFile = async (ipfsHash) => {
        try {
            // delete from pinata IPFS data storage
            setIsDeleting(true);
            await axios.delete(
                `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
                {
                    headers: {
                        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
                        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
                    },
                }
            );

            await loadUserFiles();

        } catch (error) {
            console.error("Error permanently deleting file:", error);
            alert("Failed to permanently delete file");
        } finally {
            setIsDeleting(false);
        }
    }

    const handleRecoverFile = async (fileIndex, ipfsHash) => {
        try {
            setIsDeleting(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            const tx = await contract.recoverFile(ipfsHash);
            await tx.wait();

            await loadUserFiles();

        } catch (error) {
            console.error("Error recovering file:", error);
            alert("Failed to recover file");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteFile = async (fileIndex, ipfsHash) => {
        try {
            // Delete from smart contract only.
            setIsDeleting(true);

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );
            console.log("Attempting to delete file at address:", ipfsHash);
            // console.log("File state before deletion:", files[fileIndex]);
            const tx = await contract.deleteFile(ipfsHash);
            await tx.wait();
            // setFiles(files => {
            //     const updatedFiles = [...files];
            //     const fileIndex = updatedFiles.findIndex(file => file.ipfsHash === ipfsHash);
            //     if (fileIndex !== -1) {
            //         updatedFiles[fileIndex].exists = false;
            //     }
            //     return updatedFiles;
            // });
            await loadUserFiles();

        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete file");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-gray-50">
            {/* Left Section (30%) */}
            <div className="w-1/4 bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold font-title text-neutral-950">Dashboard</h1>
                <div className="flex flex-col gap-4 mt-6">
                    <button
                        onClick={() => setActiveTab("myFiles")}
                        className={`py-2 px-4 rounded-lg ${activeTab === "myFiles" ? "bg-blue-400" : "bg-blue-300"} text-white`}
                    >
                        My Files
                    </button>
                    <button
                        onClick={() => setActiveTab("deletedFiles")}
                        className={`py-2 px-4 rounded-lg ${activeTab === "deletedFiles" ? "bg-blue-400" : "bg-blue-300"} text-white`}
                    >
                        Recently deleted
                    </button>
                </div>
                <form className="mb-8">
                    <div className="flex flex-col gap-4">
                        <label
                            htmlFor="file-upload" 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg 
                                    shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none 
                                    focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 mt-4"
                        >
                            Upload ☁
                        </label>
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileSelect}
                            className="hidden" // Hide the default file input
                        />
                    </div>
                </form>
                <FileQuotaMeter STORAGE_QUOTA={STORAGE_QUOTA} totalFileSize={totalFileSize} />
            </div>
    
            {/* Right Section (70%) */}
            <div className="w-3/4 bg-white shadow-md rounded-lg p-6">
                <p className="text-3xl text-left mb-5">
                        Wallet address: {currentWallet ? 
                            `${currentWallet.slice(0, 6)}...${currentWallet.slice(-4)}` : 
                            'Wallet not connected'}
                </p>
                <div className="container mx-auto">
                    {/* Display files */}
                    <div className="grid grid-cols-12 text-sm gap-4 p-4 border-b border-neutral-200">
                        <span className="col-span-4 text-left text-neutral-500">File Name</span>
                        <span className="col-span-3 text-left text-neutral-500">Upload Time</span>
                        <span className="col-span-2 text-left text-neutral-500">Size</span>
                        <span className="col-span-3 text-left text-neutral-500 ml-4">Actions</span>
                    </div>
                    <div className="flex flex-col space-y-4 mt-4 w-full">
                    {files.map((file, index) => {
                        const truncatedFileName = file.fileName.length > 32 
                            ? `${file.fileName.slice(0, 32)}...` 
                            : file.fileName;

                        return (
                            <div key={index} className="grid grid-cols-12 items-center py-3 px-4 bg-neutral-50 rounded-md">
                                <span className="col-span-4 text-neutral-950 text-left">{truncatedFileName}</span>
                                <span className="col-span-3 text-neutral-500 text-left">
                                    {file.uploadTime ? new Date(file.uploadTime).toLocaleString() : 'Unknown'}
                                </span>
                                <span className="col-span-2 text-neutral-500 text-left">
                                    {file.size ? formatFileSize(file.size) : 'Unknown'}
                                </span>
                                <div className="col-span-3 flex gap-2 justify-start ml-4">
                                    { activeTab === "myFiles" && <a
                                        href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-green-400 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded"
                                    >
                                        View
                                    </a>}
                                    {activeTab === "myFiles" && 
                                    <button
                                        onClick={() => downloadImage(`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`, file.fileName)}
                                        className="text-xs bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded"
                                    >
                                        Download
                                    </button>}
                                    { activeTab === "myFiles" &&
                                    <button
                                        onClick={() => handleDeleteFile(index, file.ipfsHash)}
                                        className="text-xs bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded"
                                        disabled={isDeleting}
                                    >
                                        Delete
                                    </button>}
                                    { activeTab === "deletedFiles" &&
                                    <button
                                        onClick={() => handleRecoverFile(index, file.ipfsHash)}
                                        className="text-xs bg-violet-500 hover:bg-violet-700 text-white font-semibold py-1 px-3 rounded"
                                        disabled={isDeleting}
                                    >
                                        Recover
                                    </button>}
                                    { activeTab === "deletedFiles" &&
                                    <button
                                        onClick={() => handlePermanentlyDeleteFile(file.ipfsHash)}
                                        className="text-xs bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded"
                                        disabled={isDeleting}
                                    >
                                        Permanently Delete
                                    </button>}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StorageApp;
