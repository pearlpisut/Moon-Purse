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
          <div id='homepage' className='mt-0'>
            <div className="w-full bg-gradient-to-r from-blue-900 to-gray-900 shadow-lg min-h-screen flex flex-col items-center text-neutral-50 relative overflow-hidden">  
              <header className="w-full bg-opacity-90 py-6 text-center">
                <p className='text-2xl'>welcome to</p>
                <h1 className="text-8xl mt-10 ml-20 font-bold font-mono text-primary-50">Moon Purse 🌑</h1>
              </header>
            <div className="w-full flex flex-col items-center gap-10 py-10">
              <section className="mt-0 relative w-[800px] flex flex-col items-center text-center">
                <p className="text-neutral-50 text-lg">A blockchain-secured handy storage 🔒💾</p>
              </section>
              <section className="w-[400px] flex justify-center">
                <button
                  onClick={connectMetaMask}
                  className="bg-black text-primary-50 px-6 py-3 rounded-md shadow-md transition-transform transform hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-blue-500 relative overflow-hidden"
                >
                  Connect to MetaMask
                </button>
              </section>
              <section className="w-[750px] grid grid-cols-3 gap-6">
                {[
                  { title: "Portable ☑", description: "Access your files anywhere with only your MetaMask." },
                  { title: "Secure ☑", description: "Your storage is secured by Blockchain technology." },
                  { title: "Simple ☑", description: "No need to deal with coding and crypto coins." }
                ].map((item, index) => (
                  <div key={index} className="bg-neutral-700 bg-opacity-65 p-6 rounded-md text-neutral-50 transition-transform transform hover:bg-neutral-700">
                    {/* <i className={`${item.icon} text-4xl mb-4`}></i> */}
                    <h3 className="text-lg font-medium">{item.title}</h3>
                    <p className="text-sm mt-2">{item.description}</p>
                  </div>
                ))}
              </section>
              
            </div>
            
            <div id='stars' className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {[...Array(70)].map((_, i) => (
                <span
                  key={i}
                  className="absolute w-[2px] h-[2px] bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                ></span>
              ))}
            </div>
          </div>
          <footer className="w-full bg-neutral-900 py-4 text-center">
              <p className="text-neutral-50">© Phutanate Pisutsin</p>
            </footer>
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
