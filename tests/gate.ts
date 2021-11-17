import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Gate } from "../target/types/gate";

describe("gate", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Gate as Program<Gate>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
