# Moon Purse
**A blockchain-secured handy storage.**

Moon Purse is a highly simple file storage powered by Ethereum to offer a portable file storage where users can store and access
important files anywhere from passport copy to medical papers with blockchain-level security.

## Tech Stack
### Frontend:
React, Tailwind
### Backend:
Solidity (smart contract), Pinata IPFS (Storage), Hardhat

## How to run
**1. fetch this repo to your device**
```
git clone https://github.com/pearlpisut/Moon-Purse.git
cd Moon-Purse
```
**2. frontend set-up**
```
npm install
npm run start
```
The program is now running at `localhost:3000`.

**3. Pinata set up**

Create Pinata account and generate API keys. Create a `.env` file as follows:
```
REACT_APP_PINATA_API_KEY = <your key>
REACT_APP_PINATA_SECRET_KEY = <your key>
```
**4. Backend Hardhat set-up**
```
npx hardhat init  # start a hardhat instance
npx hardhat compile 
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost # run this in another terminal
```
The last command deploys your smart contract on localhost:8545 and will return a contract address to your terminal. Copy it and paste it to `constants.js`.

**4. MetaMask hardhat network set-up**

Add a new network in MetaMask to connect to your hardhat local network with the following info:
```
Network name: <you choose>
New RPC URL: http://127.0.0.1:8545/
Chain ID: 1337
Currency Symbol: ETH
```
Now, you can access the program and use it with your metamask account!

## Developer
Phutanate Pisutsin - 1155163440

Happy to hear any comment on this project!
