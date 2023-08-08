const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
  "03c523b39a24d21c3e0158fc923df9c71db1ac0b7291ccecf8ec22cd451b7a72ce": 100, //dan public key
  "020c7b96f18c43c94dfce11fb9a452591d5f18769db6ba376186536aba8f82a387": 50, //al
  "026389b4edefdc0cfac206c5f2cca93554f74dbeb5d9146a3a4827b29852bdd052": 75, //john
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

//to do: sign tx to server and recover the publickey
app.post("/send", (req, res) => {
  const { sender, recipient, amount, hash, recoveryBit } = req.body;

  const message = {sender, amount, recipient};
  const recovered_address = await secp.recoverPublicKey(keccak256(utf8ToBytes(JSON.stringify(message))), hash, recoveryBit);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if(toHex(keccak256(recovered_address.slice(1)).slice(-20)) !== sender) {
    console.log("sender not matched");
    res.status(400).send({ message: "sender not matched!"});
  }else if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  }else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
