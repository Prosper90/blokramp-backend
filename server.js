require("dotenv").config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers, BigNumber } = require('ethers');
const ERC20ABI = require('./abi.json');
const Flutterwave = require('flutterwave-node-v3');
const got = require("got");
const bitcore = require("bitcore-lib");
const axios = require("axios");



const app = express();

// parse application/json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())


const V3_SWAP_ROUTER_ADDRESS = process.env.V3_SWAP_ROUTER_ADDRESS;
WALLET_ADDRESS = "0x60BF7D209A3bCe766c4D2441514B32FD4703747b";
WALLET_SECRET = "";
const INFURA_URL_TESTNETeth = process.env.INFURA_URL_TESTNETeth;
const INFURA_URL_TESTNETbnb = process.env.INFURA_URL_TESTNETbnb;
const INFURA_URL_TESTNETbtc = process.env.INFURA_URL_TESTNETbtc;



let returnValue = false;



app.get("/",  function(req, res){
    res.send("welcome");
  });




  //get return value
  app.get("/check",  function(req, res){
    res.send({check: returnValue});
  });


//main link https://blok-ramp.herokuapp.com/payment-callback
//test link  http://localhost:8000/payment-callback
app.post('/paymentlink', async (req, res) => {
    console.log(req.body);
      try {
        const response = await got.post("https://api.flutterwave.com/v3/payments", {
            headers: {
                Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
            },
            json: {
                tx_ref: req.body.tx,
                amount: req.body.amount,
                currency: "USD",
                redirect_url: "https://blok-ramp.herokuapp.com/payment-callback",

                customer: { 
                  email: req.body.email,
              },  

            }
        }).json();
        //console.log(response);
        res.send({response: response})
    } catch (err) {
        console.log(err.code);  
        console.log(err.response.body);
    }
})



  app.get('/payment-callback', async (req, res) => {
     console.log("Recieved and working om withdrawal");
     console.log(req.query.tx_ref);
    if (req.query.status === 'successful') {
            // Success! Confirm the customer's payment
            //Transfer the crypto
            console.log(req.query.tx_ref);
            const mix = req.query.tx_ref;

            const value = mix.split(',');

            //console.log(id, "idget");
            //console.log(mix);
            //console.log(value[1]);
            //console.log(value[2]);

            if(value[1] === "ethereum") {

                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);

                tx = {
                    to: value[2],
                    value: ethers.utils.parseEther(value[3])
                  }
     
                //instantiate wallet
                const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider)
    
                  // Signing a transaction
                await walletget.signTransaction(tx)
    
                // Sending ether
                await walletget.sendTransaction(tx);

               //res.redirect(`http://127.0.0.1:5173/${req.query.tx_ref}`);
              //const done = await got(`http://127.0.0.1:5173/${req.query.tx_ref}`, { json: true });
              //res.send(done)
              returnValue = true;

            }  else if(value[1] === "binancecoin") {

                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbnb);

                tx = {
                    to: value[2],
                    value: ethers.utils.parseEther(value[3])
                  }
     
                //instantiate wallet
                const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider)
    
                  // Signing a transaction
                await walletget.signTransaction(tx)
    
                // Sending ether
                await walletget.sendTransaction(tx);

                //res.redirect(`http://127.0.0.1:5173/${req.query.tx_ref}`);
                //const done = await got(`http://127.0.0.1:5173/${req.query.tx_ref}`, { json: true });
                //res.send(done)
                returnValue = true;

            } else if(value[1] === "bitcoin") {
            
              const sochain_network = "BTCTEST"; // the Testnet network for sochain

              /* your bitcoin address. The one you want to send funds from -- the one we just generated */
              const sourceAddress = `mpyEsPc1YFjrxTxryXAwpNSw3TFq4URQDx`;

              /**
              because the outputs come in satoshis, and 1 Bitcoin is equal to 100,000,000 satoshies, we'll multiply the amount of bitcoin by 100,000,000 to get the value in satoshis.
              */
                const satoshiToSend = value[3]/1 * 100000000;
                console.log(satoshiToSend)
                let fee = 0; 
                let inputCount = 0;
                let outputCount = 2; // we are going to use 2 as the output count because we'll only send the bitcoin to 2 addresses the receiver's address and our change address.

            
                const utxos = await axios.get(
                  `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`,
                  {
                    headers: {
                      'Accept-Encoding': 'application/json',
                    }

                  }
                );
                console.log(await utxos.data.data.txs, "one");
                
                let waitwait = await utxos.data.data.txs;

                const transaction = new bitcore.Transaction();
                let totalAmountAvailable = 0;
                let inputs = [];
                //let utxos = response.data.data.txs;
             
                for (const element of waitwait) {
                  let utxo = {};
                  utxo.satoshis = Math.floor(Number(element.value) * 100000000);
                  utxo.script = element.script_hex;
                  utxo.address = utxos.data.data.address;
                  utxo.txId = element.txid;
                  utxo.outputIndex = element.output_no;
                  totalAmountAvailable += utxo.satoshis;
                  inputCount += 1;
                  inputs.push(utxo);
                }

                console.log(totalAmountAvailable);

                const transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
                //console.log("here", 1);
                // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

                fee = transactionSize * 20
                //console.log("here", 2);
                if (totalAmountAvailable - satoshiToSend - fee  <= 0) {
                  throw new Error("Balance is too low for this transaction");
                }
                //console.log("here", 3);

                //console.log(inputs);
                //Set transaction input
                transaction.from(inputs);
                //console.log("here", 4);

                // set the recieving address and the amount to send
                //const valuetosend = satoshiToSend/100000000;
                //console.log(valuetosend,"Send");
                //console.log(satoshiToSend, "main satoshi to send");
                //console.log(Math.floor(satoshiToSend), "Satoshi to send two");
                //console.log(value[2], "reciever");
                transaction.to(value[2], Math.floor(satoshiToSend));
                //console.log("here", 5);

                // Set change address - Address to receive the left over funds after transfer
                transaction.change(sourceAddress);

                //manually set transaction fees: 20 satoshis per byte
                transaction.fee(fee);
                console.log(transaction.toObject());


               
                // Sign transaction with your private key
                transaction.sign(process.env.PRIVATEKEYBTC);


                // serialize Transactions
                const serializedTransaction = transaction.serialize();
                
                // Send transaction
                const response = await got.post(`https://sochain.com/api/v2/send_tx/${sochain_network}`, {
                  json: {
                      tx_hex: serializedTransaction,
                  }

              }).json();
              
              
              console.log(response);
              console.log(response.data.data);
              returnValue = true;
              console.log("Reached here");

              return response.data.data;


            }

      } 
    });



    //for sell calls
    //for callback "https://blok-ramp.herokuapp.com/payment-callbacktwo"
    app.post('/sellcrypto', async (req, res) => {
      console.log("called sell");
      console.log(req.body);
      //calling coingate to take crypto
      const encodedParams = new URLSearchParams();
      encodedParams.set('order_id', req.body.id);
      encodedParams.set('price_amount', req.body.amount);
      encodedParams.set('price_currency', 'USD');
      encodedParams.set('receive_currency', 'BTC');
      encodedParams.set('callback_url', 'https://blok-ramp.herokuapp.com/order-callback');
      encodedParams.set('success_url', 'https://blok-ramp.herokuapp.com/payment-callbacktwo');
      encodedParams.set('cancel_url', 'https://blockramp.vercel.app/');

      
      const options = {
        method: 'POST',
        url: 'https://api-sandbox.coingate.com/api/v2/orders',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${process.env.COINGATE_API}`
        },
        data: encodedParams,
      };
      
      /*
      axios
        .request(options)
        .then(function (response) {
          console.log(response.data);
        })
        .catch(function (error) {
          console.error(error);
        });
*/     


        const paymentLink = await axios.request(options);
        console.log(paymentLink.data);
        res.send(paymentLink.data);
        
  })

 

  //payment two callback
  app.get('/payment-callbacktwo', async (req, res) => { 
    console.log("hi");
  });


//order callback url
  app.get('/order-callback', async (req, res) => { 
    console.log("called ordercallback");
  })



app.listen(process.env.PORT || 8000,  function(){
    console.log("App is listening on url http://localhost:8000");
  });
  