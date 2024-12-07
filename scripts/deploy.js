// Import the ethers object from hardhat
const { ethers } = require("hardhat");

async function main() {
    const FileStorage = await ethers.getContractFactory("FileStorage");
    const fileStorage = await FileStorage.deploy();
    await fileStorage.waitForDeployment();
    
    const address = await fileStorage.getAddress();
    console.log("FileStorage deployed to:", address);
    
    // Verify the contract is working
    try {
        const files = await fileStorage.getUserFiles();
        console.log("Initial files array:", files);
    } catch (error) {
        console.error("Error testing contract:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 