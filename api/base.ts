import Web3 from 'web3'
import { NowRequest, NowResponse } from '@now/node';
import BigNumber from 'bignumber.js'

const ERC20ABI = require('../config/ERC20ABI')

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        "https://bsc-dataseed.binance.org"
    )
);

const getStaxPrice = async () => {
  const wstax = new web3.eth.Contract(ERC20ABI, '0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4');
  const staxAmount = await wstax.methods.balanceOf('0x13AbFA7B781bEe80cA7FAe7Ec71045488d876A8d').call()
  const wbusd = new web3.eth.Contract(ERC20ABI, '0xe9e7cea3dedca5984780bafc599bd69add087d56');
  const busdAmount = await wbusd.methods.balanceOf('0x13AbFA7B781bEe80cA7FAe7Ec71045488d876A8d').call()

  return getBalanceNumber(new BigNumber(busdAmount))/getBalanceNumber(new BigNumber(staxAmount))
}

const getBalanceNumber = (balance: any, decimals = 18) => {
  const displayBalance = balance.dividedBy(new BigNumber(10).pow(decimals))
  return displayBalance.toNumber()
}

const getTotolSupply = async () => {
    const wstax = new web3.eth.Contract(ERC20ABI, '0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4');
    return wstax.methods.totalSupply().call()
}


export default async (_req: NowRequest, res: NowResponse) => {
    const price = await getStaxPrice()
    const supply = (await getTotolSupply()) / 1e18
    const data = {
        price,
        supply
    }
    res.status(200).send(data);
};
