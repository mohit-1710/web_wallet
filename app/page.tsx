'use client';

import { Keypair } from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { useState } from 'react';
import nacl from 'tweetnacl';
import { toast } from 'sonner';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import { Copy, Eye, EyeOff } from 'lucide-react';

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

  const paths = {
    solana: (index: number) => `m/44'/501'/0'/${index}'`,
    ethereum: (index: number) => `m/44'/60'/0'/0/${index}`,
  };

  const toggleDropDown = () => setIsOpen((prev) => !prev);

  const handleMnemonicGeneration = () => {
    const generated = generateMnemonic();
    setMnemonic(generated);
  };

  const handleCryptoSelection = (crypto: string) => {
    setSelectedChain(crypto);
    setIsOpen(false);
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
      const seedBuffer = mnemonicToSeedSync(mnemonic);
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
        const wallet = ethers.Wallet.fromPhrase(mnemonic, path);
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-gray-800 to-zinc-700 py-10 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur rounded-xl p-6 space-y-6 border border-gray-200/20">
        <h1 className="text-3xl font-bold text-center text-white">Multi-Chain Wallet Generator</h1>

        <div className="space-y-2">
          <button
            onClick={handleMnemonicGeneration}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition text-sm"
          >
            Generate Seed Phrase
          </button>
          {mnemonic && <p className="break-words text-sm text-gray-200 bg-gray-700 p-2 rounded-md">{mnemonic}</p>}
        </div>

        <div className="relative">
          <button
            onClick={toggleDropDown}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition text-sm"
          >
            {selectedChain || 'Select Chain'}
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-md">
              <ul>
                {['Solana', 'Ethereum'].map((chain) => (
                  <li
                    key={chain}
                    onClick={() => handleCryptoSelection(chain)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {chain}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={generateWalletFromMnemonic}
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition text-sm"
        >
          Generate Wallet
        </button>

        <div className="space-y-4">
          {wallets.map((wallet, index) => (
            <div
              key={index}
              className="border border-gray-600 rounded-md p-4 bg-gray-900 text-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs break-words"><strong>Public Key:</strong> {wallet.publicKey}</p>
                <button onClick={() => copyToClipboard(wallet.publicKey)} className="ml-2">
                  <Copy size={14} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs break-words">
                  <strong>Private Key:</strong>
                  {showPrivateKeys[index] ? ` ${wallet.privateKey}` : ' ••••••••••••••••••••••'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => togglePrivateKeyVisibility(index)}>
                    {showPrivateKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {showPrivateKeys[index] && (
                    <button onClick={() => copyToClipboard(wallet.privateKey)}>
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

