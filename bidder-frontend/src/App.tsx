import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';

// --- API Base URL ---
// IMPORTANT: Change this to your actual backend API URL
const API_BASE_URL = '/api'; // Changed to use the proxy path

// --- Type Definitions (aligned with OpenAPI Spec) ---
interface AuthRequestDto {
  username: string;
  password: string;
}

interface AuthResponseDto {
  access_token: string;
}

interface CreateItemDto {
  name: string;
  description: string;
  startingPrice: number;
  duration: number; // in seconds
  activateAt: string; // date-time string
}

interface Item {
  id: number; // from backend API is number
  name: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  activateAt: string; // date-time string
  expireAt: string; // date-time string
  finalizedAt: string | null;
  bids: string[]; // This might be simplified on backend, per spec it's array of strings
}

interface CreateBidDto {
  amount: number;
}

// Frontend specific types for display
interface AuctionItemDisplay extends Omit<Item, 'activateAt' | 'expireAt'> {
  auctionEndTime: number; // Unix timestamp for frontend display
}

interface UserContextType {
  backendAccessToken: string | null; // Backend JWT token
  isAuthenticated: boolean; // Based on backendAccessToken
  backendLogin: (username: string, password: string) => Promise<void>;
  backendLogout: () => Promise<void>;
}

interface MessageContextType {
  message: string | null;
  type: 'success' | 'error' | 'info' | null;
  showMessage: (msg: string, type: 'success' | 'error' | 'info') => void;
  clearMessage: () => void;
}

// --- Contexts ---
const AuthContext = createContext<UserContextType | undefined>(undefined);
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// --- Custom Hooks ---
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

// --- Utility Functions ---
const formatTimeLeft = (endTime: number) => {
  const now = Date.now();
  const timeLeft = endTime - now;

  if (isNaN(timeLeft) || timeLeft <= 0) {
    return 'Auction Ended';
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`;
};

// --- Providers ---
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [backendAccessToken, setBackendAccessToken] = useState<string | null>(localStorage.getItem('backend_access_token'));

  // Backend authentication callbacks, memoized for stability
  const backendLogin = useCallback(async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data: AuthResponseDto = await response.json();
    setBackendAccessToken(data.access_token);
    localStorage.setItem('backend_access_token', data.access_token);
  }, []); // setBackendAccessToken is guaranteed to be stable by React

  const backendLogout = useCallback(async () => {
    setBackendAccessToken(null);
    localStorage.removeItem('backend_access_token');
  }, []); // setBackendAccessToken is guaranteed to be stable by React

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    backendAccessToken,
    isAuthenticated: !!backendAccessToken, // Frontend auth state derived from backend token
    backendLogin,
    backendLogout,
  }), [backendAccessToken, backendLogin, backendLogout]); // Only re-create if backendAccessToken or the memoized functions change

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'success' | 'error' | 'info' | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Memoize clearMessage as it's a dependency of showMessage
  const clearMessage = useCallback(() => {
    setMessage(null);
    setType(null);
  }, []); // Dependencies are stable setters

  // Memoize showMessage
  const showMessage = useCallback((msg: string, msgType: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setType(msgType);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => clearMessage(), 300); // clearMessage is stable
    }, 3000);
  }, [clearMessage]); // Dependencies are stable setters and memoized clearMessage

  // Memoize the context value
  const value = useMemo(() => ({
    message,
    type,
    showMessage,
    clearMessage,
  }), [message, type, showMessage, clearMessage]); // Only re-create if message, type, or the memoized functions change

  return (
    <MessageContext.Provider value={value}>
      {children}
      {isVisible && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${
          type === 'success' ? 'bg-green-500 text-white' :
          type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {message}
          <button onClick={() => setIsVisible(false)} className="ml-4 font-bold text-lg leading-none">&times;</button>
        </div>
      )}
    </MessageContext.Provider>
  );
};

// --- API Service (Integrated with Backend) ---
const apiService = {
  async _fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('backend_access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    return response.json();
  },

  // Create a new auction item
  createItem: async (item: CreateItemDto): Promise<Item> => {
    return apiService._fetch<Item>(`${API_BASE_URL}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // Get all auction items
  getAllItems: async (): Promise<Item[]> => {
    return apiService._fetch<Item[]>(`${API_BASE_URL}/items`, {
      method: 'GET',
    });
  },

  // Get a single auction item by ID
  getItemById: async (itemId: number): Promise<Item> => {
    // Note: The OpenAPI spec does not explicitly show a GET /items/{itemId} endpoint,
    // but it's implied by the need to fetch single item details.
    // If your backend doesn't have this, you might need to adjust or rely on client-side state.
    return apiService._fetch<Item>(`${API_BASE_URL}/items/${itemId}`, {
      method: 'GET',
    });
  },

  // Place a bid on an item
  placeBid: async (itemId: number, bidAmount: number): Promise<any> => { // Backend Bid schema is empty, so 'any' for now
    const payload: CreateBidDto = { amount: bidAmount };
    return apiService._fetch<any>(`${API_BASE_URL}/items/${itemId}/bids`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// --- Components ---

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

// Countdown Timer Component
const CountdownTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const isEnded = timeLeft === 'Auction Ended';
  const textColorClass = isEnded ? 'text-red-600' : 'text-blue-600';

  return (
    <p className={`text-lg font-semibold ${textColorClass}`}>
      Time Left: {timeLeft}
    </p>
  );
};

// Auth Form Component
const Auth: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { backendLogin } = useAuth();
  const { showMessage } = useMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await backendLogin(username, password);
      showMessage('Logged in successfully!', 'success');
      setCurrentPage('dashboard');
    } catch (error: any) {
      showMessage(`Login failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out flex items-center justify-center"
          >
            {loading && <LoadingSpinner />}
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account? Please contact your administrator to create one.
        </p>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<{ setCurrentPage: (page: string, itemId?: number) => void }> = ({ setCurrentPage }) => {
  const [items, setItems] = useState<AuctionItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, backendLogout } = useAuth();
  const { showMessage } = useMessage();

  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetchedItems = await apiService.getAllItems();
      const processedItems: AuctionItemDisplay[] = fetchedItems.map(item => {
        const parsedStartingPrice = parseFloat(item.startingPrice as any);
        const parsedCurrentPrice = parseFloat(item.currentPrice as any);

        let auctionEndTime = Date.parse(item.expireAt);
        return {
          ...item,
          startingPrice: isNaN(parsedStartingPrice) ? 0 : parsedStartingPrice,
          currentPrice: isNaN(parsedCurrentPrice) ? 0 : parsedCurrentPrice,
          auctionEndTime: auctionEndTime, // Ensure auctionEndTime is a valid number
        };
      }).sort((a, b) => new Date(b.activateAt).getTime() - new Date(a.activateAt).getTime()); // Sort by activateAt, newest first
      setItems(processedItems);
    } catch (error: any) {
      backendLogout()
      showMessage(`Failed to load auction items: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showMessage]);

  useEffect(() => {
    fetchItems();
    // This effect should only run when 'isAuthenticated' changes or on initial mount.
    // 'fetchItems' is now stable due to useCallback and its dependencies.
  }, [fetchItems]); // This dependency is now stable

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Live Auctions</h1>
        <button
          onClick={() => setCurrentPage('create-item')}
          className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold shadow-md hover:bg-green-700 transition duration-200 ease-in-out transform hover:scale-105"
        >
          Create New Item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-600 text-xl py-10">No auction items available yet. Be the first to create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out overflow-hidden transform hover:-translate-y-1"
            >
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    Starting Price: <span className="font-semibold text-indigo-600">${item.startingPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-lg font-medium text-gray-700">
                    Current Bid: <span className="font-semibold text-green-600">${item.currentPrice.toFixed(2)}</span>
                  </p>
                  <CountdownTimer endTime={item.auctionEndTime} />
                </div>
                <button
                  onClick={() => setCurrentPage('auction-detail', item.id)}
                  className="mt-6 w-full bg-indigo-500 text-white py-3 rounded-md font-semibold hover:bg-indigo-600 transition duration-200 ease-in-out shadow-md"
                >
                  View Details & Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Create Item Component
const CreateItem: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showMessage("You must be logged in to create an item.", "error");
      return;
    }
    if (startingPrice <= 0) {
      showMessage("Starting price must be greater than zero.", "error");
      return;
    }
    if (duration <= 0) {
      showMessage("Auction duration must be greater than zero seconds.", "error");
      return;
    }

    setLoading(true);
    try {
      // Always use current time for activateAt as it's optional and not user-controlled
      const activateAt = new Date().toISOString().slice(0, 19);

      const newItem: CreateItemDto = {
        name,
        description,
        startingPrice,
        duration: duration,
        activateAt: activateAt,
      };

      await apiService.createItem(newItem);
      showMessage('Auction item created successfully!', 'success');
      setCurrentPage('dashboard');
    } catch (error: any) {
      showMessage(`Error creating item: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">Create New Auction Item</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700">Starting Price ($)</label>
            <input
              type="number"
              id="startingPrice"
              value={startingPrice}
              onChange={(e) => setStartingPrice(parseFloat(e.target.value))}
              min="0.01"
              step="0.01"
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Auction Duration (Seconds)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="1"
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out flex items-center justify-center"
          >
            {loading && <LoadingSpinner />}
            Create Item
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
            className="w-full mt-3 bg-gray-300 text-gray-800 p-3 rounded-md font-semibold hover:bg-gray-400 transition duration-150 ease-in-out"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

// Auction Detail Component
const AuctionDetail: React.FC<{ itemId: number | null; setCurrentPage: (page: string, itemId?: number) => void }> = ({ itemId, setCurrentPage }) => {
  const [item, setItem] = useState<AuctionItemDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [placingBid, setPlacingBid] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showMessage } = useMessage();

  const fetchItemDetails = useCallback(async () => {
    if (itemId === null || !isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const fetchedItem = await apiService.getItemById(itemId);
      const processedItem: AuctionItemDisplay = {
        ...fetchedItem,
        // Ensure price fields are parsed as numbers from API response
        startingPrice: parseFloat(fetchedItem.startingPrice as any),
        currentPrice: parseFloat(fetchedItem.currentPrice as any),
        auctionEndTime: Date.parse(fetchedItem.expireAt),
      };

      setItem(processedItem);
      setBidAmount(processedItem.currentPrice + 0.01); // Suggest a slightly higher bid
    } catch (error: any) {
      showMessage(`Failed to load auction details: ${error.message}`, 'error');
      setCurrentPage('dashboard'); // Redirect to dashboard on error
    } finally {
      setLoading(false);
    }
  }, [itemId, isAuthenticated, showMessage, setCurrentPage]);

  useEffect(() => {
    fetchItemDetails(); // Initial fetch

    // Set up polling for real-time updates
    const pollingInterval = setInterval(fetchItemDetails, 5000); // Poll every 5 seconds

    return () => clearInterval(pollingInterval); // Cleanup polling on unmount
  }, [fetchItemDetails]);


  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showMessage("You must be logged in to place a bid.", "error");
      return;
    }
    if (!item) return;

    const now = Date.now();
    if (now > item.auctionEndTime) {
      showMessage("Auction has ended. Cannot place bid.", "error");
      return;
    }
    if (bidAmount <= item.currentPrice) {
      showMessage(`Bid must be higher than the current highest bid ($${item.currentPrice.toFixed(2)}).`, "error");
      return;
    }

    setPlacingBid(true);
    try {
      await apiService.placeBid(item.id, bidAmount);
      showMessage('Bid placed successfully!', 'success');
      // No need to manually update item here, polling will fetch the new price
    } catch (error: any) {
      showMessage(`Failed to place bid: ${error.message}`, 'error');
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!item) {
    return <div className="text-center p-8 text-gray-700">Item not found or an error occurred.</div>;
  }
  const auctionEnded = Date.now() > item.auctionEndTime;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{item.name}</h1>
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">{item.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Starting Price:</p>
              <p className="text-2xl font-bold text-indigo-600">${item.startingPrice.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-medium">Current Highest Bid:</p>
              <p className="text-3xl font-bold text-green-700">${item.currentPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-8">
            <CountdownTimer endTime={item.auctionEndTime} />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            {auctionEnded ? (
              <div className="text-center text-red-600 text-2xl font-bold py-4 bg-red-50 rounded-lg">
                Auction has ended!
              </div>
            ) : (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label htmlFor="bidAmount" className="block text-lg font-medium text-gray-800 mb-2">
                    Your Bid ($)
                  </label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                    min={(item.currentPrice + 0.01).toFixed(2)} // Ensure min bid is higher
                    step="0.01"
                    required
                    className="mt-1 block w-full p-4 border border-gray-300 rounded-lg shadow-sm text-xl focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={placingBid || auctionEnded}
                  className="w-full bg-indigo-600 text-white p-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out flex items-center justify-center"
                >
                  {placingBid && <LoadingSpinner />}
                  Place Bid
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// Main App Component
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <MessageProvider>
        <AuthProvider>
          {/* AppContent now encapsulates the logic that needs to consume contexts */}
          <AppContent />
        </AuthProvider>
      </MessageProvider>
    </div>
  );
};

// New AppContent Component to handle routing and context consumption
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('auth'); // 'auth', 'dashboard', 'create-item', 'auction-detail'
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  // useAuth and useMessage can now be called safely here because AppContent is a child of the providers
  const { isAuthenticated, backendLogout } = useAuth();
  const { showMessage } = useMessage();

  const handleSetPage = useCallback((page: string, itemId?: number) => {
    setSelectedItemId(itemId !== undefined ? itemId : null);
    setCurrentPage(page);
  }, []); // Dependencies are stable setters

  useEffect(() => {
    // Redirect to dashboard if authenticated and not already on a specific item detail
    // No isAuthReady check needed anymore since Firebase is removed.
    if (isAuthenticated && currentPage === 'auth') {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);


  let content;
  // Simplified auth check: if not authenticated, always show Auth form.
  if (!isAuthenticated && currentPage !== 'auth') {
    content = <Auth setCurrentPage={handleSetPage} />;
  } else {
    switch (currentPage) {
      case 'dashboard':
        content = <Dashboard setCurrentPage={handleSetPage} />;
        break;
      case 'create-item':
        content = <CreateItem setCurrentPage={handleSetPage} />;
        break;
      case 'auction-detail':
        content = <AuctionDetail itemId={selectedItemId} setCurrentPage={handleSetPage} />;
        break;
      case 'auth':
      default:
        content = <Auth setCurrentPage={handleSetPage} />;
        break;
    }
  }

  return (
    <> {/* Fragment to wrap header and main */}
      <header className="bg-indigo-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Real-time Bidding</h1>
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <button
              onClick={backendLogout}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md transition duration-200 ease-in-out font-medium"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main className="flex-grow">
        {content}
      </main>
    </>
  );
};


export default App;
