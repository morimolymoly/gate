import "./App.css";
import { Program, Provider, web3 } from "@project-serum/anchor";

import React, { useEffect, useState } from "react";

import { Connection, programs } from "@metaplex/js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { getPhantomWallet } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Metadata, MetadataDataData } from "@metaplex/js/lib/programs/metadata";
import { metaplex } from "@metaplex/js/lib/programs";
require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet(),
];

let check_token = true;

const connection = new Connection("devnet");

async function getMetaDataAddress(tokenMint: PublicKey): Promise<string> {
  const METADATA_PREFIX = "metadata";
  const METADATA_PROGRAM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM);
  const metaProgamPublicKeyBuffer = metaProgamPublicKey.toBuffer();
  const metaProgamPrefixBuffer = Buffer.from(METADATA_PREFIX);

  const aaa = await PublicKey.findProgramAddress(
    [metaProgamPrefixBuffer, metaProgamPublicKeyBuffer, tokenMint.toBuffer()],
    metaProgamPublicKey
  );

  return aaa[0].toString();
}

async function getMetaData(
  pubkey: string | undefined
): Promise<Metadata | undefined> {
  try {
    if (pubkey === undefined) {
      throw console.error();
    }
    const ownedMetadata = await programs.metadata.Metadata.load(
      connection,
      pubkey
    );
    return ownedMetadata;
  } catch {
    console.log("Failed to fetch metadata");
  }
}

async function parseMetadata(
  uri: string | undefined
): Promise<MetadataDataData | undefined> {
  if (uri === undefined) {
    return undefined;
  }

  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const obj: Promise<MetadataDataData> = res.json();
  return obj;
}

function App(): JSX.Element {
  const [nftdata, setNftdata] = useState<MetadataDataData[]>([]);

  function addNftdata(data: MetadataDataData | undefined) {
    if (data === undefined) {
      console.log("undefined!!!!!!!!!!!!!!!11");
    } else {
      console.log(data);
      const new_data = [...nftdata, data];
      // setNftdata(new_data);
      setNftdata((nftdata) => [...nftdata, data]);
      console.log(new_data, nftdata);
    }
  }

  useEffect(() => {
    console.log(nftdata);
  }, [nftdata]);

  const wallet = useWallet();

  async function onClick() {
    check_token = false;
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    const con = new web3.Connection("https://api.devnet.solana.com");
    const filter: web3.TokenAccountsFilter = {
      programId: new web3.PublicKey(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      ),
    };
    const splAccounts = await con.getParsedTokenAccountsByOwner(
      wallet.publicKey,
      filter
    );

    const nftAccounts = splAccounts.value.filter(({ account }) => {
      const amount = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      const decimals = account?.data?.parsed?.info?.tokenAmount?.decimals;

      return decimals === 0 && amount >= 1;
    });

    const accountsMetaDataAddressP = await Promise.allSettled(
      nftAccounts.map(({ account }) => {
        const mint_address = account?.data?.parsed?.info?.mint;
        if (mint_address) {
          return getMetaDataAddress(new PublicKey(mint_address));
        }
      })
    );

    const accountsMetaDataAddress = accountsMetaDataAddressP
      .filter(({ status }) => status === "fulfilled")
      .map(
        (p) =>
          (p as PromiseFulfilledResult<Promise<PublicKey> | undefined>)?.value
      );

    const metadata = await Promise.all(
      accountsMetaDataAddress.map(
        async (value) => await getMetaData((await value)?.toString())
      )
    );

    metadata.forEach(async (p) => {
      const uri = p?.data?.data?.uri;
      const nft_data = await parseMetadata(uri);
      addNftdata(nft_data);
    });
  }

  if (wallet.connected) {
    return (
      <div className="App">
        <h1>MY NFT</h1>
        {check_token && <button onClick={onClick}>check tokens</button>}
        {nftdata.map((data, idx) => {
          // TODO: Remove this any convertion!
          const d = data as any;
          return (
            <div key={idx}>
              <p>{d.symbol}</p>
              <p>{d.name}</p>
              <p>{d.uri}</p>
              <img src={d.image} />
            </div>
          );
        })}
      </div>
    );
  } else {
    return (
      <div className="app">
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
);

export default AppWithProvider;
