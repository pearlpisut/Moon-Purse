// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FileStorage {
    // Structure for file information
    struct File {
        string fileName;
        string ipfsHash;
        bool exists;
    }

    // Mapping from user address to their files
    // Using array as users can have multiple files
    mapping(address => File[]) private userFiles;

    // Events for frontend updates
    event FileUploaded(
        address indexed user,
        string ipfsHash,
        string fileName,
        uint256 timestamp
    );

    event FileDeleted(
        address indexed user,
        string ipfsHash
    );

    // Add a new file
    function addFile(string memory _ipfsHash, string memory _fileName) public {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");

        File memory newFile = File({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            exists: true
        });

        userFiles[msg.sender].push(newFile);
        
        emit FileUploaded(msg.sender, _ipfsHash, _fileName, block.timestamp);
    }

    // Get all files for a user
    function getUserFiles() public view returns (File[] memory) {
        return userFiles[msg.sender];
    }

    // Delete a file
    function deleteFile(uint256 _fileIndex) public {
        require(_fileIndex < userFiles[msg.sender].length, "File index out of bounds");
        require(userFiles[msg.sender][_fileIndex].exists, "File already deleted");

        string memory ipfsHash = userFiles[msg.sender][_fileIndex].ipfsHash;
        
        // Mark as deleted (we keep the array length same to maintain indices)
        userFiles[msg.sender][_fileIndex].exists = false;
        
        emit FileDeleted(msg.sender, ipfsHash);
    }

    // Get total number of files for a user
    function getUserFileCount() public view returns (uint256) {
        return userFiles[msg.sender].length;
    }
}