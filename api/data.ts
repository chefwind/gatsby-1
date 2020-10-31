import { NowRequest, NowResponse } from '@now/node';
import template from '../config/template';
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

const ERC20ABI = require('../config/ERC20ABI')

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        "https://bsc-dataseed.binance.org"
    )
);

const yearCakes = 105120000

const getBalanceNumber = (balance: any, decimals = 18) => {
  const displayBalance = balance.dividedBy(new BigNumber(10).pow(decimals))
  return displayBalance.toNumber()
}

const getBnbPrice = async () => {
  const wbnb = new web3.eth.Contract(ERC20ABI, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  const bnbAmount = await wbnb.methods.balanceOf('0x1b96b92314c44b159149f7e0303511fb2fc4774f').call()
  const wbusd = new web3.eth.Contract(ERC20ABI, '0xe9e7cea3dedca5984780bafc599bd69add087d56');
  const busdAmount = await wbusd.methods.balanceOf('0x1b96b92314c44b159149f7e0303511fb2fc4774f').call()

  return getBalanceNumber(new BigNumber(busdAmount))/getBalanceNumber(new BigNumber(bnbAmount))
}

const getStaxPrice = async () => {
  const wbnb = new web3.eth.Contract(ERC20ABI, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  const bnbAmount = await wbnb.methods.balanceOf('0x7FB0017195470bc6978659396eC9D750A35C51fE').call()
  const wstax = new web3.eth.Contract(ERC20ABI, '0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4');
  const staxAmount = await wstax.methods.balanceOf('0x7FB0017195470bc6978659396eC9D750A35C51fE').call()
  const bnbPrice = await getBnbPrice()

  return getBalanceNumber(new BigNumber(bnbAmount)) / getBalanceNumber(new BigNumber(staxAmount)) * bnbPrice
}

const lpAddress = [
  "0x7FB0017195470bc6978659396eC9D750A35C51fE", // STAX-BNB FLIP
  "0x13AbFA7B781bEe80cA7FAe7Ec71045488d876A8d", // STAX-BUSD FLIP
  "0xc15fa3E22c912A276550F3E5FE3b0Deb87B55aCd", // BUSD-USDT FLIP
  "0x3aB77e40340AB084c3e23Be8e5A6f7afed9D41DC", // BUSD-DAI FLIP
  "0xb3c4217AB2b265bF8c69718D280E3708b5E50577", // USDT-DAI FLIP
  "0x85f8628bfff75d08f1aa415e5c7e85d96bfd7f57", // USDT-USDC FLIP
]


const farm = async () => {
// const handler = async (event) => {
  let data = template.pools

  const wbusd = new web3.eth.Contract(ERC20ABI, '0xe9e7cea3dedca5984780bafc599bd69add087d56');

  const bnbprice = await getBnbPrice()
  const staxprice = await getStaxPrice()

  let TVL = 0

  const promises = lpAddress.map(async (lp, index) => {
    const lpamout = await wbusd.methods.balanceOf(lp).call()
    let totalStaked = getBalanceNumber(new BigNumber(lpamout)) * 2
    const apy = data[index + 1].points / 3700 * yearCakes * staxprice / totalStaked
    data[index + 1].totalStaked = totalStaked
    data[index + 1].apr = apy
    TVL =  TVL +totalStaked
  })

  await Promise.all(promises)

  return {...template, TVL, pools: data}

}

export default async (_req: NowRequest, res: NowResponse) => {
//   const date = new Date().toString();
  const data = await farm()
  res.status(200).send(data);
};
