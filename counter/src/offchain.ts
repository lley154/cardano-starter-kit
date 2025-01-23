import {
    applyCborEncoding,
    parseDatumCbor,
} from "@meshsdk/core-csl";
import {
    AppWalletKeyType,
    BlockfrostProvider,
    ConStr0,
    deserializeAddress,
    Integer,
    MeshWallet,
    MeshTxBuilder,
    mConStr0,
    PubKeyHash,
    serializePlutusScript,
} from "@meshsdk/core";

import blueprint from "../plutus.json";

const apiKey = process.env.BLOCKFROST_KEY as string;
        if (!apiKey) {
            throw console.error("BLOCKFROST_KEY not set");
        }
export const provider = new BlockfrostProvider(apiKey);
  
export const newWallet = (providedMnemonic?: string[]) => {
let mnemonic = providedMnemonic;
if (!providedMnemonic) {
    mnemonic = MeshWallet.brew() as string[];
    console.log(
    "Wallet generated, if you want to reuse the same address, please save the mnemonic:"
    );
    console.log(mnemonic);
}
const signingKey: AppWalletKeyType = {
    type: "mnemonic",
    words: mnemonic as string[],
};

const wallet = new MeshWallet({
        key: signingKey,
        networkId: 0,
        fetcher: provider,
        submitter: provider,
    });
    return wallet;
};

const spendingScriptCompiledCode = blueprint.validators[0].compiledCode;
const spendingScriptCbor = applyCborEncoding(spendingScriptCompiledCode);
const validatorAddress = serializePlutusScript({
    code: spendingScriptCbor,
    version: "V3",
}).address;  

export class MeshTx {
    constructor(public wallet: MeshWallet, public provider: BlockfrostProvider) {}
  
    newTx = async () => {
      const address = (await this.wallet.getUsedAddresses())[0];
  
      const txBuilder = new MeshTxBuilder({
        fetcher: this.provider,
        evaluator: this.provider,
      });
      const utxos = await this.wallet.getUtxos();
      txBuilder.changeAddress(address).selectUtxosFrom(utxos);
      return txBuilder;
    };
  
    newValidationTx = async () => {
      const txBuilder = await this.newTx();
      const collateral = (await this.wallet.getCollateral())[0];
      txBuilder.txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      );
      return txBuilder;
    };

    lockUtxoWithDatum = async () => {
        try {
            const address = this.wallet.getChangeAddress();
            const ownPubKey = deserializeAddress(address).pubKeyHash;
            
            // Log for debugging
            console.log("Building transaction with datum...");
            console.log("ValidatorAddress:", validatorAddress);
            console.log("PubKeyHash:", ownPubKey);

            const txBuilder = await this.newTx();
            const txHex = await txBuilder
                .txOut(
                    validatorAddress, 
                    [{ unit: "lovelace", quantity: "2000000" }]
                )
                .txOutInlineDatumValue(mConStr0([ownPubKey, 0]))
                .complete();

            console.log("Transaction built successfully");
            const singedTx = await this.wallet.signTx(txHex);
            const txHash = await this.wallet.submitTx(singedTx);
            console.log("Transaction submitted. TxHash:", txHash);
            return txHash;
        } catch (error) {
            console.error("Error in lockUtxoWithDatum:", error);
            throw error;
        }
    };
  
    incrementDatum = async () => {
        try {
            let datum: ConStr0<[PubKeyHash, Integer]> | null = null;
            const incrementValue = 1n;
            const address = this.wallet.getChangeAddress();
            const ownPubKey = deserializeAddress(address).pubKeyHash;

            const scriptInput = (
                await this.provider.fetchAddressUTxOs(validatorAddress)
              ).find((input) => {
                if (input.output.plutusData) {
                  datum = parseDatumCbor(input.output.plutusData);
                  if (datum && datum.fields && datum.fields.length > 0) {
                    return datum.fields[0].bytes === ownPubKey;
                  }
                }
                return false;
              });

            console.log("ScriptInput:", scriptInput);
            
            const newDatum = mConStr0([ownPubKey, BigInt(datum!.fields[1].int) + incrementValue]);
            const txBuilder = await this.newValidationTx();

            // Log for debugging
            console.log("Building transaction to increment datum...");
            console.log("ValidatorAddress:", validatorAddress);
            console.log("PubKeyHash:", ownPubKey);
            console.log("Datum:", datum);
            console.log("IncrementValue:", incrementValue);
            console.log("New Datum:", newDatum);

            const txHex = await txBuilder
                .spendingPlutusScriptV3()
                .txIn(
                    scriptInput!.input.txHash,
                    scriptInput!.input.outputIndex,
                    scriptInput!.output.amount,
                    scriptInput!.output.address
                )
                .txInInlineDatumPresent()
                .txInScript(spendingScriptCbor)
                .txInRedeemerValue(mConStr0([incrementValue]))
                .txOut(
                    validatorAddress, 
                    [{ unit: "lovelace", quantity: "2000000" }]
                )
                .txOutInlineDatumValue(newDatum)
                .requiredSignerHash(ownPubKey)
                .complete();

            console.log("Transaction built successfully");
            const singedTx = await this.wallet.signTx(txHex);
            const txHash = await this.wallet.submitTx(singedTx);
            console.log("Transaction submitted. TxHash:", txHash);
            return txHash;
        } catch (error) {
            console.error("Error in incrementDatum:", error);
            throw error;
        }
    };
  }
