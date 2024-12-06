import { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StorageApp from './pages/storageApp';
import Navbar from './components/Navbar';

function App() {
  // State to track MetaMask connection
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to check initial connection and set up listeners
  useEffect(() => {
    // Check if already connected
    checkConnection();

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    // Cleanup listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Handler for account changes
  const handleAccountChange = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false);
      setAccount(null);
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  };

  // Handler for disconnect event
  const handleDisconnect = () => {
    setIsConnected(false);
    setAccount(null);
  };

  // Check if currently connected
  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Hey! Error checking connection:", error);
      }
    }
  };

  // prompt user to connect to metamask
  const connectMetaMask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        console.log("no metamask connected");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Navbar />
        {!isConnected ? (
          <div>
            <h1>welcome to Moon</h1>
            <p>a blockchain-secured handy file storage</p>
            <button onClick={connectMetaMask}>connect to MetaMask</button>
          </div>
        ) : (
          <Routes>
            <Route path="/app" element={<StorageApp />} />
            <Route path="/" element={<Navigate to="/app" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
