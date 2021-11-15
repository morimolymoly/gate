import './App.css';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import { Connection, programs } from '@metaplex/js';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { Metadata } from '@metaplex/js/lib/programs/metadata';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
];

const connection = new Connection('devnet');

async function getMetaDataAddress(tokenMint: PublicKey): Promise<string> {
  const METADATA_PREFIX = 'metadata';
  const METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
  const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
  const metaProgamPublicKeyBuffer = metaProgamPublicKey.toBuffer();
  const metaProgamPrefixBuffer = Buffer.from(METADATA_PREFIX);

  const aaa = await PublicKey.findProgramAddress(
    [metaProgamPrefixBuffer, metaProgamPublicKeyBuffer, tokenMint.toBuffer()],
    metaProgamPublicKey
  );

  return aaa[0].toString();
}

async function getMetaData(pubkey: string | undefined): Promise<Metadata | undefined> {
  try {
    if(pubkey === undefined) {
      throw console.error();
    }
    const ownedMetadata = await programs.metadata.Metadata.load(connection, pubkey);
    return ownedMetadata;
  } catch {
    console.log('Failed to fetch metadata');
  }
}

function App(): JSX.Element {
  const wallet = useWallet();

  console.log(wallet);

  async function onClick() {
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    const con = new web3.Connection("https://api.devnet.solana.com");
    const filter: web3.TokenAccountsFilter = {
      programId: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    };
    const splAccounts = await con.getParsedTokenAccountsByOwner(wallet.publicKey, filter);

    const nftAccounts = splAccounts.value.filter(({ account }) => {
      const amount = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      const decimals = account?.data?.parsed?.info?.tokenAmount?.decimals;

      return decimals === 0 && amount >= 1;
    });

    const accountsMetaDataAddressP = await Promise.allSettled(
      nftAccounts.map(({ account }) => {
        const mint_address = account?.data?.parsed?.info?.mint;
        if(mint_address) {
          return getMetaDataAddress(new PublicKey(mint_address));
        }
      })
    );

    const accountsMetaDataAddress = accountsMetaDataAddressP
      .filter(({ status }) => status === 'fulfilled')
      .map((p) => (p as PromiseFulfilledResult<Promise<PublicKey> | undefined>)?.value);
    
    const metadata = await Promise.all(accountsMetaDataAddress.map(async (value) => await getMetaData((await value)?.toString())));
    
    metadata.forEach((p) => {
      console.log(p?.data?.data?.uri);
    });
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
