import { Wallet } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-zinc-900 via-gray-800 to-zinc-700 py-4 px-6 shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Wallet size={20} />
          <span>WalletForge</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-gray-300">
          <a href="#" className="hover:text-white transition">Home</a>
          <a href="#" className="hover:text-white transition">Docs</a>
          <a href="#" className="hover:text-white transition">GitHub</a>
        </div>
      </div>
    </nav>
  );
}

