require("dotenv").config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers, BigNumber } = require('ethers');
const ERC20ABI = require('./abi.json');
const Flutterwave = require('flutterwave-node-v3');
const got = require("got");



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






app.get("/",  function(req, res){
    res.send("welcome");
  });



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

            } else if(value[1] === "bitcoin") {

                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbtc);

                tx = {
                    to: value[2],
                    value: ethers.utils.parseEther(value[3])
                  }
     
                //instantiate wallet
                const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider)
    
                  // Signing a transaction
                await walletget.signTransaction(tx)
    
                // Sending ether
                await walletget.sendTransaction(tx)
            }


            res.send("Worked");


      } 
    });





app.listen(process.env.PORT || 8000,  function(){
    console.log("App is listening on url http://localhost:8000");
  });
  