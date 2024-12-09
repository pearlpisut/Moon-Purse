// Import the ABI from the JSON file
import FileStorageArtifact from "./artifacts/contracts/FileStorage.sol/FileStorage.json";

export const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // from hardhat local
// export const CONTRACT_ADDRESS = "0x203659f21FB7f34F0D1a83Db7A3252f177948031"; // from remix sepolia acc
export const CONTRACT_ABI = FileStorageArtifact.abi; 