'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, DollarSign, Shield, Activity, Database, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchTokenPrices } from '@/utils/api';
import { getEthBalance, getTokenBalance, getUniswapPositions, getAavePositions, getCompoundPositions, formatAddress, formatCurrency } from '@/utils/web3';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

interface TokenBalance {
  symbol: string;
  balance: string;
  price: number;
  value: number;
}

interface DefiPosition {
  protocol: string;
  type: string;
  token: string;
  amount: string;
  value: number;
  apy?: number;
  yield?: number;
}

interface PortfolioData {
  totalValue: number;
  tokens: TokenBalance[];
  defiPositions: DefiPosition[];
  totalYield: number;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 0,
    tokens: [],
    defiPositions: [],
    totalYield: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'mock' | 'real'>('real');

  const fetchMockData = useCallback(async (): Promise<PortfolioData> => {
    return {
      totalValue: 15420.50,
      tokens: [
        { symbol: 'ETH', balance: '2.5', price: 3200, value: 8000 },
        { symbol: 'USDC', balance: '5000', price: 1, value: 5000 },
        { symbol: 'UNI', balance: '100', price: 24.2, value: 2420 }
      ],
      defiPositions: [
        {
          protocol: 'Uniswap',
          type: 'LP Position',
          token: 'ETH/USDC',
          amount: '1.2 ETH + 3840 USDC',
          value: 7680,
          apy: 12.5
        },
        {
          protocol: 'Aave',
          type: 'Supply',
          token: 'USDC',
          amount: '2000 USDC',
          value: 2000,
          apy: 3.2,
          yield: 64
        },
        {
          protocol: 'Compound',
          type: 'Supply',
          token: 'ETH',
          amount: '0.8 ETH',
          value: 2560,
          apy: 2.8,
          yield: 71.68
        }
      ],
      totalYield: 135.68
    };
  }, []);

  const fetchRealData = useCallback(async (address: string): Promise<PortfolioData> => {
    try {
      toast.loading('Fetching real blockchain data...', { id: 'data-fetch' });
      const tokenIds = ['ethereum', 'uniswap', 'aave', 'compound-governance-token', 'dai', 'tether', 'weth'];
      const prices = await fetchTokenPrices(tokenIds);
      const ethBalance = await getEthBalance(address);
      const ethPrice = prices.ethereum?.usd || 3200;
      const ethValue = parseFloat(ethBalance) * ethPrice;
      const commonTokens = [
        { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI' },
        { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE' },
        { address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', symbol: 'COMP' },
        { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
      ];
      const tokenBalances: TokenBalance[] = [];
      if (parseFloat(ethBalance) > 0) {
        tokenBalances.push({
          symbol: 'ETH',
          balance: ethBalance,
          price: ethPrice,
          value: ethValue
        });
      }
      for (const token of commonTokens) {
        try {
          const balanceData = await getTokenBalance(token.address, address);
          if (parseFloat(balanceData.balance) > 0 && balanceData.symbol) {
            const price = prices[token.symbol.toLowerCase()]?.usd || 0;
            const value = parseFloat(balanceData.balance) * price;
            tokenBalances.push({
              symbol: balanceData.symbol,
              balance: balanceData.balance,
              price: price,
              value: value
            });
          }
        } catch {
          // Continue with other tokens even if one fails
        }
      }
      const [uniswapPositions, aavePositions, compoundPositions] = await Promise.all([
        getUniswapPositions(address),
        getAavePositions(address),
        getCompoundPositions(address)
      ]);
      const allPositions = [...uniswapPositions, ...aavePositions, ...compoundPositions];
      const totalValue = tokenBalances.reduce((sum, token) => sum + token.value, 0) + 
                        allPositions.reduce((sum, pos) => sum + pos.value, 0);
      const totalYield = allPositions.reduce((sum, pos) => sum + (pos.yield || 0), 0);
      const realData = {
        totalValue,
        tokens: tokenBalances,
        defiPositions: allPositions,
        totalYield
      };
      toast.success('Real data loaded successfully!', { id: 'data-fetch' });
      return realData;
    } catch {
      toast.error('Failed to fetch real data, showing mock data instead', { id: 'data-fetch' });
      return await fetchMockData();
    }
  }, [fetchMockData]);

  const fetchPortfolioData = useCallback(async (address: string) => {
    setIsLoading(true);
    let data: PortfolioData;
    if (dataSource === 'real') {
      data = await fetchRealData(address);
    } else {
      data = await fetchMockData();
      toast.success('Mock data loaded successfully!');
    }
    setPortfolioData(data);
    setIsLoading(false);
  }, [dataSource, fetchRealData, fetchMockData]);

  // Listen for account changes and update UI
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          fetchPortfolioData(accounts[0]);
        } else {
          setIsConnected(false);
          setWalletAddress('');
          setPortfolioData({ totalValue: 0, tokens: [], defiPositions: [], totalYield: 0 });
        }
      };
      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [fetchPortfolioData]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask not found! Please install MetaMask extension first.');
      return;
    }
    try {
      setIsLoading(true);
      toast.loading('Opening MetaMask...', { id: 'wallet-connect' });
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (!accounts || accounts.length === 0) throw new Error('No accounts found');
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      toast.success(`Wallet connected: ${formatAddress(accounts[0])}`, { id: 'wallet-connect' });
      await fetchPortfolioData(accounts[0]);
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4001) {
        toast.error('Connection rejected by user', { id: 'wallet-connect' });
      } else if (err.code === -32002) {
        toast.error('Please check MetaMask popup and approve connection', { id: 'wallet-connect' });
      } else {
        toast.error(`Connection failed: ${err.message || 'Unknown error'}`, { id: 'wallet-connect' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDataSource = async () => {
    const newSource = dataSource === 'mock' ? 'real' : 'mock';
    setDataSource(newSource);
    if (isConnected && walletAddress) {
      await fetchPortfolioData(walletAddress);
    }
  };

  const refreshData = async () => {
    if (isConnected && walletAddress) {
      await fetchPortfolioData(walletAddress);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            DeFi Portfolio Tracker
          </h1>
          <p className="text-gray-300">
            Connect your wallet to view real DeFi positions across Uniswap, Aave, and Compound
          </p>
        </div>
        {/* Data Source Toggle */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {dataSource === 'mock' ? (
                  <Database className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Zap className="w-5 h-5 text-blue-400" />
                )}
                <span className="text-white font-medium">
                  Data Source: {dataSource === 'mock' ? 'Mock Data' : 'Real Blockchain Data'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm">Toggle:</span>
                <button
                  onClick={toggleDataSource}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dataSource === 'real' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dataSource === 'real' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            {isConnected && (
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-300">
            {dataSource === 'mock' ? (
              <p>📊 Using mock data for demonstration. Switch to &quot;Real Data&quot; to see your actual blockchain data.</p>
            ) : (
              <p>🔗 Connected to real blockchain data. This shows your actual wallet balances and DeFi positions.</p>
            )}
          </div>
        </div>
        {/* Wallet Connection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          {!isConnected ? (
            <div className="text-center">
              <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-4">
                Connect Your Real Wallet
              </h2>
              <p className="text-gray-300 mb-6">
                Connect your MetaMask wallet to view your real DeFi portfolio data
              </p>
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
              >
                <Wallet className="w-5 h-5" />
                <span>{isLoading ? 'Connecting...' : 'Connect MetaMask Wallet'}</span>
              </button>
              <p className="text-xs text-gray-400 mt-4">
                This will open MetaMask and request permission to connect
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">
                  Connected: {formatAddress(walletAddress)}
                </span>
                <span className="text-green-400 text-sm bg-green-400/20 px-2 py-1 rounded">
                  {dataSource === 'real' ? 'Real Data Mode' : 'Mock Data Mode'}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsConnected(false);
                  setWalletAddress('');
                  setPortfolioData({ totalValue: 0, tokens: [], defiPositions: [], totalYield: 0 });
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        {isConnected && (
          <>
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total Portfolio Value</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(portfolioData.totalValue)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      {dataSource === 'real' ? 'Real Data' : 'Mock Data'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total Yield Earned</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(portfolioData.totalYield)}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      {dataSource === 'real' ? 'Real Data' : 'Mock Data'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Active Positions</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolioData.defiPositions.length}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      {dataSource === 'real' ? 'Real Data' : 'Mock Data'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Tokens Held</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolioData.tokens.length}
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                      {dataSource === 'real' ? 'Real Data' : 'Mock Data'}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>
            {/* Token Balances */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">Token Balances</h2>
              {portfolioData.tokens.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left text-gray-300 py-3">Token</th>
                        <th className="text-right text-gray-300 py-3">Balance</th>
                        <th className="text-right text-gray-300 py-3">Price</th>
                        <th className="text-right text-gray-300 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.tokens.map((token, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          <td className="py-3">
                            <span className="text-white font-medium">{token.symbol}</span>
                          </td>
                          <td className="text-right py-3">
                            <span className="text-white">{token.balance}</span>
                          </td>
                          <td className="text-right py-3">
                            <span className="text-gray-300">{formatCurrency(token.price)}</span>
                          </td>
                          <td className="text-right py-3">
                            <span className="text-white font-semibold">
                              {formatCurrency(token.value)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No token balances found in your wallet</p>
                  <p className="text-gray-400 text-sm mt-2">Try switching to mock data to see example data</p>
                </div>
              )}
            </div>
            {/* DeFi Positions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">DeFi Positions</h2>
              {portfolioData.defiPositions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioData.defiPositions.map((position, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-400">
                          {position.protocol}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {position.type}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-white font-medium">{position.token}</p>
                          <p className="text-gray-300 text-sm">{position.amount}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">
                            {formatCurrency(position.value)}
                          </span>
                          {position.apy && (
                            <span className="text-green-400 text-sm">
                              {position.apy}% APY
                            </span>
                          )}
                        </div>
                        {position.yield && (
                          <div className="pt-2 border-t border-gray-600/30">
                            <p className="text-gray-300 text-sm">
                              Yield: <span className="text-green-400">{formatCurrency(position.yield)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No DeFi positions found in your wallet</p>
                  <p className="text-gray-400 text-sm mt-2">Try switching to mock data to see example positions</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
