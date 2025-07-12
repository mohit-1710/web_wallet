'use client';

import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { useState } from 'react';
import nacl from 'tweetnacl';
import { toast } from 'sonner';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import { Copy, Eye, EyeOff } from 'lucide-react';

// Client-side only imports to prevent hydration errors
let bip39: typeof import('bip39') | null = null;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bip39 = require('bip39');
}

interface UserWallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}

export default function Home() {
  const [mnemonic, setMnemonic] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState('');
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [accountIndex, setAccountIndex] = useState(0);
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean[]>([]);
  const [showSeed, setShowSeed] = useState(true);

  const paths = {
    solana: (index: number) => `m/44'/501'/0'/${index}'`,
    ethereum: (index: number) => `m/44'/60'/0'/0/${index}`,
  };

  const toggleDropDown = () => setIsOpen((prev) => !prev);

  const handleMnemonicGeneration = () => {
    if (bip39) {
      const generated = bip39.generateMnemonic();
      setMnemonic(generated);
    }
  };

  const handleCryptoSelection = (crypto: string) => {
    setSelectedChain(crypto);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const togglePrivateKeyVisibility = (index: number) => {
    const updated = [...showPrivateKeys];
    updated[index] = !updated[index];
    setShowPrivateKeys(updated);
  };

  const generateWalletFromMnemonic = (): UserWallet | null => {
    try {
      if (!bip39) {
        toast.error('BIP39 not available');
        return null;
      }
      const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
      const chainKey = selectedChain.toLowerCase() as keyof typeof paths;

      if (!(chainKey in paths)) {
        toast.error('Unsupported chain selected');
        return null;
      }

      const path = paths[chainKey](accountIndex);

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (chainKey === 'solana') {
        const derivedSeed = derivePath(path, seedBuffer.toString('hex')).key;
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);
        privateKeyEncoded = bs58.encode(secretKey);
        publicKeyEncoded = keypair.publicKey.toBase58();
      } else if (chainKey === 'ethereum') {
        const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
        const wallet = hdNode.derivePath(path);
        publicKeyEncoded = wallet.address;
        privateKeyEncoded = wallet.privateKey;
      } else {
        toast.error('Unsupported chain type');
        return null;
      }

      const wallet: UserWallet = {
        publicKey: publicKeyEncoded,
        privateKey: privateKeyEncoded,
        mnemonic,
        path,
      };

      setWallets((prev) => [...prev, wallet]);
      setShowPrivateKeys((prev) => [...prev, false]);
      setAccountIndex((prev) => prev + 1);
      return wallet;
    } catch (e) {
      toast.error('Failed to generate wallet. Please try again later.' + e);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-white mb-2 tracking-wide">
            Wallet Generator
          </h1>
          <p className="text-gray-400 text-base font-light">
            Secure multi-chain wallet creation
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-2xl">
          
          {/* Seed Phrase Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-white">Seed Phrase</h2>
              <button
                onClick={handleMnemonicGeneration}
                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 text-sm"
              >
                Generate
              </button>
            </div>
            
            {mnemonic && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 uppercase tracking-wide">Recovery Phrase</span>
                  <button
                    onClick={() => setShowSeed(!showSeed)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {showSeed ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 p-4 bg-black/30 rounded-xl border border-gray-800">
                  {mnemonic.split(' ').map((word, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center py-2 px-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <span className="text-sm font-mono text-gray-300">
                        {showSeed ? word : '••••••••'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chain Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-3">Select Blockchain</h2>
            <div className="grid grid-cols-2 gap-3">
              {['Solana', 'Ethereum'].map((chain) => (
                <button
                  key={chain}
                  onClick={() => handleCryptoSelection(chain)}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                    selectedChain === chain
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800/70 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{chain}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {chain === 'Solana' ? 'Fast & Low fees' : 'Smart contracts'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Wallet */}
          <div className="mb-6">
            <button
              onClick={generateWalletFromMnemonic}
              disabled={!mnemonic || !selectedChain}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Generate Wallet
            </button>
          </div>

          {/* Wallets */}
          {wallets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-white mb-3">Generated Wallets</h2>
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl space-y-3"
                >
                  {/* Public Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 uppercase tracking-wide">Public Key</span>
                      <button 
                        onClick={() => copyToClipboard(wallet.publicKey)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg border border-gray-700">
                      <p className="text-sm font-mono text-gray-300 break-all">
                        {wallet.publicKey}
                      </p>
                    </div>
                  </div>

                  {/* Private Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 uppercase tracking-wide">Private Key</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => togglePrivateKeyVisibility(index)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPrivateKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {showPrivateKeys[index] && (
                          <button 
                            onClick={() => copyToClipboard(wallet.privateKey)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg border border-gray-700">
                      <p className="text-sm font-mono text-gray-300 break-all">
                        {showPrivateKeys[index] ? wallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

