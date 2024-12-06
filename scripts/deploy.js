// Import the ethers object from hardhat
const { ethers } = require("hardhat");

async function main() {
    const FileStorage = await ethers.getContractFactory("FileStorage");
    const fileStorage = await FileStorage.deploy();
    await fileStorage.waitForDeployment();

    console.log("FileStorage deployed to:", await fileStorage.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 