// Import the ABI from the JSON file
import FileStorageArtifact from "./artifacts/contracts/FileStorage.sol/FileStorage.json";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // from hardhat local
// export const CONTRACT_ADDRESS = "0x203659f21FB7f34F0D1a83Db7A3252f177948031"; // from remix sepolia acc
export const CONTRACT_ABI = FileStorageArtifact.abi; 