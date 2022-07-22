import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { LpusdAuction } from "../../target/types/lpusd_auction";
import {
  Connection,
  SYSVAR_RENT_PUBKEY, PublicKey
} from "@solana/web3.js";

import { 
    CBSProtocolIDL,
    CBS_PREFIX,
    NETWORK, 
    PREFIX,
    StableLpsolPool,
    StableLpusdPool,
    pythRayAccount,
    pythUsdcAccount,
    pythSolAccount,
    pythMsolAccount,
    pythSrmAccount,
    pythScnsolAccount,
    pythStsolAccount,
    LiquidityPool,
    LpfinanceTokenIDL,
} from "../config";

import { convert_to_wei, getATAPublicKey, getCreatorKeypair, getPublicKey, print_config_data, print_user_data } from "../utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const { Wallet } = anchor;

const liquidate = async () => {
  const connection = new Connection(NETWORK, "confirmed");

  const creatorKeypair = getCreatorKeypair();

  anchor.setProvider(new anchor.AnchorProvider(connection, new Wallet(creatorKeypair), anchor.AnchorProvider.defaultOptions()));
  const program = anchor.workspace.LpusdAuction as Program<LpusdAuction>;
  // Config
  const config = getPublicKey('auction_config');  
  const auctionConfigData = await program.account.config.fetch(config);


  const lptokenProgramId = LpfinanceTokenIDL.metadata.address;

  const PDA = await PublicKey.findProgramAddress(
    [Buffer.from(PREFIX)],
    program.programId
  );

  const lpusdMint= auctionConfigData.lpusdMint as PublicKey;
  const lpusdAta = auctionConfigData.poolLpusd as PublicKey;

  const lpsolMint= auctionConfigData.lpsolMint as PublicKey;
  const lpsolAta = auctionConfigData.poolLpsol as PublicKey;

  const [userAccount, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(PREFIX), Buffer.from(creatorKeypair.publicKey.toBuffer())],
    program.programId
  );

  const cbsProgramId = new PublicKey(CBSProtocolIDL.metadata.address);
  const [cbsAccount, cbsBump] = await PublicKey.findProgramAddress(
    [Buffer.from(CBS_PREFIX), Buffer.from(creatorKeypair.publicKey.toBuffer())],
    cbsProgramId
  );
  

  const withdraw_wei = convert_to_wei("1");
  const withdraw_amount = new anchor.BN(withdraw_wei);
  
  await program.rpc.burnForLiquidate({
    accounts: {
        owner: creatorKeypair.publicKey,
        auctionPda: PDA[0],
        config: config,
        userAccount,
        cbsAccount,
        lpusdMint,
        lpusdAta,
        lpsolMint,
        lpsolAta,
        stableLpsolPool: StableLpsolPool,
        stableLpusdPool: StableLpusdPool,
        pythUsdcAccount,
        pythRayAccount,
        pythSolAccount,
        pythMsolAccount,
        pythSrmAccount,
        pythScnsolAccount,
        pythStsolAccount,
        liquidityPool: LiquidityPool,
        lptokensProgram: lptokenProgramId,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY
    },
  });

  console.log("Deposit successfully")

  const auctionConfigDataAfterDeposit = await program.account.config.fetch(config);
  print_config_data(auctionConfigDataAfterDeposit)

  const userData = await program.account.userAccount.fetch(userAccount);
  print_user_data(userData)
}

liquidate();
