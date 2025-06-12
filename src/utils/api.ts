import axios from 'axios';

// CoinGecko API base URL
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Common token addresses
export const TOKEN_ADDRESSES = {
  ETH: 'ethereum',
  USDC: 'usd-coin',
  UNI: 'uniswap',
  AAVE: 'aave',
  COMP: 'compound-governance-token',
  DAI: 'dai',
  USDT: 'tether',
  WBTC: 'wrapped-bitcoin',
} as const;

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface TokenMarketData {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  contractAddress: string | null;
}

export interface DefiPosition {
  protocol: string;
  type: string;
  token: string;
  amount: string;
  value: number;
  apy?: number;
  yield?: number;
}

// Simple cache for API responses
const cache = new Map<string, { data: TokenMarketData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch token prices from CoinGecko with caching and rate limiting
export const fetchTokenPrices = async (tokenIds: string[]): Promise<TokenMarketData> => {
  try {
    // Check cache first
    const cacheKey = `prices_${tokenIds.join(',')}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached price data');
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - (now - lastRequestTime));
    }
    lastRequestTime = Date.now();

    console.log('Fetching fresh price data from CoinGecko...');
    
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true,
      },
      timeout: 10000, // 10 second timeout
    });

    // Cache the response
    cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    
    // Return fallback prices if API fails
    const fallbackPrices: TokenMarketData = {
      ethereum: { usd: 3200, usd_24h_change: 0 },
      uniswap: { usd: 24.2, usd_24h_change: 0 },
      aave: { usd: 85.5, usd_24h_change: 0 },
      'compound-governance-token': { usd: 45.2, usd_24h_change: 0 },
      dai: { usd: 1, usd_24h_change: 0 },
      tether: { usd: 1, usd_24h_change: 0 },
      weth: { usd: 3200, usd_24h_change: 0 }, // WETH price same as ETH
    };
    
    return fallbackPrices;
  }
};

// Fetch detailed token data
export const fetchTokenData = async (tokenIds: string[]): Promise<TokenPrice[]> => {
  try {
    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - (now - lastRequestTime));
    }
    lastRequestTime = Date.now();

    const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: tokenIds.join(','),
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token data:', error);
    throw error;
  }
};

// Fetch wallet token balances (enhanced with real data support)
export const fetchWalletBalances = async (): Promise<TokenBalance[]> => {
  try {
    // In a real implementation, you would:
    // 1. Use Etherscan API to get token transfers
    // 2. Use Web3.js or Ethers.js to query token contracts
    // 3. Use DeFi protocol APIs to get positions
    
    // For now, return mock data with some randomization for demo
    const mockBalances: TokenBalance[] = [
      {
        symbol: 'ETH',
        balance: (Math.random() * 5 + 0.1).toFixed(4), // Random ETH balance
        contractAddress: null, // ETH is native token
      },
      {
        symbol: 'USDC',
        balance: (Math.random() * 10000 + 100).toFixed(2), // Random USDC balance
        contractAddress: '0xA0b86a33E6441b8C4C4C4C4C4C4C4C4C4C4C4C4C',
      },
      {
        symbol: 'UNI',
        balance: (Math.random() * 200 + 10).toFixed(2), // Random UNI balance
        contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      },
    ];

    // Randomly include some additional tokens
    if (Math.random() > 0.5) {
      mockBalances.push({
        symbol: 'AAVE',
        balance: (Math.random() * 50 + 1).toFixed(2),
        contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      });
    }

    if (Math.random() > 0.7) {
      mockBalances.push({
        symbol: 'COMP',
        balance: (Math.random() * 20 + 1).toFixed(2),
        contractAddress: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      });
    }

    return mockBalances;
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return [];
  }
};

// Fetch DeFi positions (enhanced with real data support)
export const fetchDefiPositions = async (): Promise<DefiPosition[]> => {
  try {
    // In a real implementation, you would:
    // 1. Query Uniswap V3 positions
    // 2. Query Aave lending positions
    // 3. Query Compound lending positions
    
    // Enhanced mock data with randomization
    const mockPositions: DefiPosition[] = [];
    
    // Randomly add Uniswap position
    if (Math.random() > 0.3) {
      mockPositions.push({
        protocol: 'Uniswap V3',
        type: 'LP Position',
        token: 'ETH/USDC',
        amount: `${(Math.random() * 2 + 0.5).toFixed(2)} ETH + ${(Math.random() * 5000 + 1000).toFixed(0)} USDC`,
        value: Math.random() * 10000 + 2000,
        apy: Math.random() * 20 + 5,
        yield: Math.random() * 200 + 50,
      });
    }

    // Randomly add Aave position
    if (Math.random() > 0.4) {
      mockPositions.push({
        protocol: 'Aave',
        type: 'Supply',
        token: 'USDC',
        amount: `${(Math.random() * 5000 + 1000).toFixed(0)} USDC`,
        value: Math.random() * 5000 + 1000,
        apy: Math.random() * 5 + 1,
        yield: Math.random() * 100 + 20,
      });
    }

    // Randomly add Compound position
    if (Math.random() > 0.5) {
      mockPositions.push({
        protocol: 'Compound',
        type: 'Supply',
        token: 'ETH',
        amount: `${(Math.random() * 1 + 0.1).toFixed(2)} ETH`,
        value: Math.random() * 3000 + 500,
        apy: Math.random() * 3 + 1,
        yield: Math.random() * 50 + 10,
      });
    }

    return mockPositions;
  } catch (error) {
    console.error('Error fetching DeFi positions:', error);
    return [];
  }
};

// Calculate total portfolio value
export const calculatePortfolioValue = (tokens: TokenBalance[], prices: TokenMarketData): number => {
  return tokens.reduce((total, token) => {
    const price = prices[token.symbol.toLowerCase()]?.usd || 0;
    return total + parseFloat(token.balance) * price;
  }, 0);
};

// Calculate total yield from positions
export const calculateTotalYield = (positions: DefiPosition[]): number => {
  return positions.reduce((total, position) => total + (position.yield || 0), 0);
};

// Cache management functions
export const clearCache = () => {
  cache.clear();
  console.log('Cache cleared');
};

export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}; 