import './App.css';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import React, { FC, useCallback } from 'react';
import { Wallet } from './wallet'


function App(): JSX.Element {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  return (
    <div className="App">
      <Wallet></Wallet>
    </div>
  );
}

export default App;
