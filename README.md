# DeFi Portfolio Tracker

A comprehensive web-based tool to track DeFi positions across major protocols including Uniswap, Aave, and Compound. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🏦 Portfolio Overview
- **Total Portfolio Value**: Real-time calculation of your entire DeFi portfolio
- **Yield Tracking**: Monitor earnings across all protocols
- **Position Count**: Track active positions and token holdings
- **Visual Dashboard**: Beautiful, responsive interface with real-time updates

### 🔗 Wallet Integration
- **MetaMask Support**: Seamless wallet connection
- **Multi-Chain Ready**: Currently supports Ethereum mainnet
- **Secure**: No private keys stored, direct blockchain interaction

### 📊 DeFi Protocol Support
- **Uniswap V3**: LP position tracking with APY calculations
- **Aave**: Lending and borrowing position monitoring
- **Compound**: Supply and borrow position tracking
- **Token Balances**: ERC20 token balance monitoring

### 💰 Real-time Data
- **CoinGecko Integration**: Live price feeds for all supported tokens
- **Yield Calculations**: Real-time APY and yield earnings
- **Portfolio Analytics**: Comprehensive portfolio breakdown

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js v5
- **APIs**: CoinGecko (free tier)
- **UI Components**: Lucide React, Headless UI
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask browser extension
- Ethereum wallet with some test funds

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd defi-portfolio-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Usage

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Your wallet address will be displayed

2. **View Portfolio**
   - Total portfolio value and yield are displayed
   - Token balances are shown in a table format
   - DeFi positions are displayed as cards

3. **Monitor Positions**
   - Track LP positions on Uniswap
   - Monitor lending positions on Aave and Compound
   - View real-time APY and yield earnings

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main portfolio tracker page
│   └── globals.css         # Global styles
├── utils/
│   ├── api.ts              # API utilities and CoinGecko integration
│   └── web3.ts             # Web3 utilities and contract interactions
└── components/             # Reusable UI components (future)
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# CoinGecko API (free tier)
NEXT_PUBLIC_COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Ethereum RPC (optional - defaults to MetaMask provider)
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Etherscan API (for enhanced token data)
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Supported Networks

Currently supports:
- Ethereum Mainnet

Future support planned for:
- Polygon
- Arbitrum
- Optimism
- BSC

## API Integration

### CoinGecko API
- Free tier with rate limiting
- Real-time price data
- Market cap and volume information
- 24h price change data

### DeFi Protocol APIs
- **Uniswap**: Position manager contract queries
- **Aave**: Lending pool data
- **Compound**: cToken balance tracking

## Customization

### Adding New Protocols

1. **Add Contract Addresses**
   ```typescript
   // In utils/web3.ts
   export const CONTRACT_ADDRESSES = {
     // ... existing addresses
     NEW_PROTOCOL: '0x...',
   };
   ```

2. **Create Protocol Functions**
   ```typescript
   export const getNewProtocolPositions = async (walletAddress: string) => {
     // Implementation
   };
   ```

3. **Update Main Component**
   ```typescript
   // In page.tsx, add to fetchPortfolioData
   const newProtocolData = await getNewProtocolPositions(address);
   ```

### Styling Customization

The app uses Tailwind CSS for styling. Key classes:
- `bg-white/10 backdrop-blur-lg`: Glass morphism effect
- `text-white`: Primary text color
- `text-gray-300`: Secondary text color
- `bg-blue-600`: Primary button color

## Security Considerations

- **No Private Keys**: The app never stores or transmits private keys
- **Client-Side Only**: All Web3 interactions happen in the browser
- **MetaMask Security**: Relies on MetaMask's security model
- **Read-Only**: Currently read-only, no transaction signing

## Performance Optimization

- **Lazy Loading**: Components load on demand
- **Caching**: API responses cached for better performance
- **Debouncing**: Wallet connection and data fetching optimized
- **Responsive Design**: Optimized for all screen sizes

## Troubleshooting

### Common Issues

1. **MetaMask Not Found**
   - Install MetaMask browser extension
   - Ensure you're on a supported network

2. **No Data Displayed**
   - Check wallet connection
   - Verify you have positions on supported protocols
   - Check browser console for errors

3. **API Rate Limits**
   - CoinGecko free tier has rate limits
   - Consider upgrading to paid tier for production use

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

## Roadmap

### Phase 1 (Current)
- ✅ Basic portfolio tracking
- ✅ Wallet connection
- ✅ Multi-protocol support
- ✅ Responsive design

### Phase 2 (Planned)
- 📊 Historical performance charts
- 🔔 Price alerts and notifications
- 📱 Mobile app version
- 🌐 Multi-chain support

### Phase 3 (Future)
- 🤖 AI-powered portfolio insights
- 📈 Advanced analytics
- 🔗 More DeFi protocol integrations
- 💼 Portfolio rebalancing suggestions

---

**Disclaimer**: This tool is for educational and informational purposes. Always do your own research and never invest more than you can afford to lose. DeFi protocols carry inherent risks.
