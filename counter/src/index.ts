import { 
    MeshTx,
    newWallet,
    provider
} from "./offchain";

const seed = [
    'rally',      'tape',     'wrestle',
    'enroll',     'alter',    'orange',
    'isolate',    'genuine',  'lunar',
    'february',   'island',   'curve',
    'jealous',    'stay',     'search',
    'session',    'grid',     'inside',
    'present',    'recall',   'lava',
    'often',      'above',    'rubber',
]

const wallet = newWallet(seed);

async function lockUtxoWithDatum() {
    console.log('\n--- Before Locking Utxo With Datum ---');
    const tx = new MeshTx(wallet, provider);
    const txHash = await tx.lockUtxoWithDatum();
    console.log('\n--- After Locking Utxo With Datum ---');
    console.log({ txHash });
}

async function incrementDatum() {
    console.log('\n--- Before Incrementing Datum ---');
    const tx = new MeshTx(wallet, provider);
    const txHash = await tx.incrementDatum();
    console.log('\n--- After Incrementing Datum ---');
    console.log({ txHash });
}

const action = process.argv[2];

if (action === 'lock') {
    lockUtxoWithDatum().catch(error => {
        console.error('\n--- Error Occurred ---');
        console.error(error);
    });
    } else if (action === 'increment') {
    incrementDatum().catch(error => {
        console.error('\n--- Error Occurred ---');
        console.error(error);
    });
} else {
      console.error('Usage: npm run lock | npm run increment');
      process.exit(1);
}
