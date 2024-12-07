import { useState, useEffect } from "react";
import axios from "axios";
import { ethers, BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

function StorageApp() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("No file selected");
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);

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

            // Debug logs to verify environment variables
            console.log("API Key available:", !!process.env.REACT_APP_PINATA_API_KEY);
            console.log("Secret Key available:", !!process.env.REACT_APP_PINATA_SECRET_KEY);

            const formData = new FormData();
            formData.append("file", file);

            const resFile = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: `${process.env.REACT_APP_PINATA_API_KEY}`,
                    pinata_secret_api_key: `${process.env.REACT_APP_PINATA_SECRET_KEY}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            const ipfsHash = resFile.data.IpfsHash;

            // 2. Store in smart contract
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            // Call our smart contract's addFile function
            const tx = await contract.addFile(ipfsHash, fileName);
            await tx.wait();

            // Reset form
            setFileName("No file selected");
            setFile(null);
            
            // Refresh files list
            loadUserFiles();

        } catch (error) {
            console.error("Error uploading file:", error);
            // More detailed error logging
            if (error.response) {
                console.error("Pinata Response Error:", {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    // Function to load user's files from smart contract
    const loadUserFiles = async () => {
        try {
            if (!window.ethereum) {
                console.log("Please install MetaMask");
                return;
            }

            // Add network check
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("Connected to chain:", chainId);
            
            if (chainId !== '0x539') { // 1337 in hex
                console.error("Please connect to Localhost:8545");
                return;
            }

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            console.log("Signer address:", await signer.getAddress());
            console.log("Contract Address:", CONTRACT_ADDRESS);
            
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            // Test contract connection
            const count = await contract.getUserFileCount();
            console.log("File count:", count);
            
            const userFiles = await contract.getUserFiles();
            console.log("Raw userFiles response:", userFiles);
            
            setFiles(userFiles.filter(file => file.exists));
        } catch (error) {
            console.error("Detailed error:", {
                message: error.message,
                code: error.code,
                data: error.data,
                stack: error.stack
            });
            
            // Check specific conditions
            if (!window.ethereum.selectedAddress) {
                console.error("No account selected. Please connect MetaMask");
            }
            
            if (error.code === 'BAD_DATA') {
                console.log("Contract interaction error. Please check:");
                console.log("1. MetaMask is connected to localhost:8545");
                console.log("2. Contract is deployed to the correct network");
                console.log("3. Contract address is correct:", CONTRACT_ADDRESS);
            }
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

    return (
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
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Your Files</h2>
                <div className="grid gap-4">
                    {files.map((file, index) => (
                        <div key={index} className="border p-4 rounded">
                            <p>Name: {file.fileName}</p>
                            <p>IPFS: {file.ipfsHash}</p>
                            <a 
                                href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500"
                            >
                                View File
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StorageApp;
