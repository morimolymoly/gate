import './App.css';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import { Connection, programs } from '@metaplex/js';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
];

const connection = new Connection('devnet');

function App(): JSX.Element {
  const wallet = useWallet();

  console.log(wallet);

  async function onClick() {
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    const con = new web3.Connection("https://api.devnet.solana.com");
    const filter: web3.TokenAccountsFilter =  {
      programId: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    };
    const test = await con.getTokenAccountsByOwner(wallet.publicKey, filter);
    console.log(test.value[0].pubkey);
    const tokenAddress = test.value[0].pubkey;
    console.log(tokenAddress.toString());

    const run = async () => {
      try {
        const ownedMetadata = await programs.metadata.Metadata.load(connection, "8Yvyrz7AosXNyt2xocpbJdmDEqpM73pme66uoGG2rkwM");
        console.log(ownedMetadata);
      } catch {
        console.log('Failed to fetch metadata');
      }
    };
    run();
  }
  
  if (wallet.connected) {
    return (
      <div className="App">
        <button onClick={onClick}>
              check tokens
        </button>
      </div>
    );
  } else {
    return (
      <div className='app'>
        <WalletMultiButton />
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="https://api.devnet.solana.com">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
