# Cardano Starter Kit

## Wallet Setup

- Install Eternal browser wallet https://chromewebstore.google.com/detail/eternl/kmhcihpebfmpgmihbkipmjlmmioameka 
- Select the network button on the bottom right to change to the pre-production network
- Create a new wallet
- Select the receive tab and copy a receiving address
- Go to https://docs.cardano.org/cardano-testnets/tools/faucet
- Select the preprod drop down menu and past the receiving address
- Select request funds
- Wait about 30 seconds, and the funds should appear in your wallet
- Select the Plug icon at the top right in Eternl to enable the account to be accessible to a dApp

## Blockfrost API Key

- Go to blockfrost https://blockfrost.io/ 
- Sign up for a free account
- Go to your dashboard
- Create a project, and select the preprod network
- Copy the preprod API key and use below

## Launch Web App (Ubuntu Linux OS)

- Open a terminal window
- Add the following environment variables to the ~/.bashrc file
```
export BLOCKFROST_KEY="your-blockfrost-api-key"
export NEXT_PUBLIC_ENV="dev"
export NEXT_PUBLIC_HOST="localhost"
export NEXT_PUBLIC_PROTOCOL="http"
export NEXT_PUBLIC_PORT=":3000"
```

- Close and reopen the terminal window
- Then run the following commands
```
$ git clone https://github.com/lley154/cardano-starter-kit.git
$ cd cardano-starter-kit/vesting
$ npm install
$ npm run dev
```

- Go to http://localhost:3000/
- Select Eternl
- A popup window will appear to allow access to Eternl from this webapp. 
- The Wallet Info box should show your wallet Ada (lovelace) balance

![image](https://github.com/user-attachments/assets/3fbc8a4b-4d01-4b7f-afdf-a99e3e99fd94)


## Lock Transaction

- Select Lock UTXO
- Sign the transaction
- You can see the transaction in your Eternl wallet in the transaction tab

## Unlock Transaction

- Select Unlock UTXO
- Sign the transaction
- You can see the transaction in your Eternl wallet in the transaction tab

## Cancel Transaction

- Select Cancel UTXO
- Sign the transaction
- You can see the transaction in your Eternl wallet in the transaction tab

## CBOR Debugging
- To inpsect the CBOR included in the transaction use https://cbor.nemo157.com/

