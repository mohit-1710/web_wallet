'use client';
import { useState } from "react";

export const DropDownButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [crypto, setCrypto] = useState("");
  const toggleDropDown = () => setIsOpen((prev) => !prev);
  const handleClick = (crypto: string) => {
    setCrypto(crypto);
    setIsOpen(false);
  }
  return (
    <div className="relative inline-block text-left">
      <button onClick={toggleDropDown} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {crypto ? `${crypto}` : "Select Crypto"}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-white border rounded shadow-lg">
          <ul>
            <li onClick={() => handleClick("Solana")} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Solana</li>
            <li onClick={() => handleClick("Ethereum")} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Ethereum</li>
          </ul>
        </div>
      )}
    </div>
  )
}
