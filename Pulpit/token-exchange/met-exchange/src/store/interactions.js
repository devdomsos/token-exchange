import Web3 from 'web3'
// import * as Utils from 'web3-utils';
import {
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling,
  orderFilled,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade
} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'


//https://github.com/ethereum/web3.js/issues/2328


// The static property utils do no longer exist on the Web3 class. If you would like to use the web3-utils module then please install just the web3-utils module.

const web3_utils = require('web3-utils');

export const loadWeb3 = (dispatch) => {


// https://ethereum.stackexchange.com/questions/66202/undefined-results-for-web3-eth-accounts-in-truffle-console/77105?noredirect=1#comment94236_77105


  const ethereum = window.ethereum;
const web3instance = window.web3;
const web3 = new Web3(Web3.givenProvider || 'http://localhost:7546')
// const web3 = new Web3(ethereum);
const enabledWeb3 =  ethereum.enable();

 console.log('this is web3', web3)
 console.log('this is ethereum.enabled()', enabledWeb3)

  // const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545')
  dispatch(web3Loaded(web3))
  return web3
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts()
  const account = accounts[0]
  dispatch(web3AccountLoaded(account))
  return account
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    const token = web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    dispatch(tokenLoaded(token))
    return token
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    const exchange = web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
    dispatch(exchangeLoaded(exchange))
    return exchange
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  // Fetch cancelled orders with the "Cancel" event stream
  const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
  // Format cancelled orders
  const cancelledOrders = cancelStream.map((event) => event.returnValues)
  // Add cancelled orders to the redux store
  dispatch(cancelledOrdersLoaded(cancelledOrders))

  // Fetch filled orders with the "Trade" event stream
  const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
  // Format filled orders
  const filledOrders = tradeStream.map((event) => event.returnValues)
  // Add cancelled orders to the redux store
  dispatch(filledOrdersLoaded(filledOrders))

  // Load order stream
  const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0,  toBlock: 'latest' })
  // Format order stream
  const allOrders = orderStream.map((event) => event.returnValues)
  // Add open orders to the redux store
  dispatch(allOrdersLoaded(allOrders))
}


export const cancelOrder = (dispatch, exchange, order, account) => {
   // fetch the order id from the smart contract and get the account which is trying to cancel the order
  exchange.methods.cancelOrder(order.id).send({ from: account })
  .on('transactionHash', (hash) => {
     dispatch(orderCancelling())
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
  })
}

export const fillOrder = async (dispatch, exchange, order, account) => {
   // fetch the order id from the smart contract and get the account which is trying to cancel the order
  exchange.methods.fillOrder(order.id).send({ from: account })
  .on('transactionHash', (hash) => {
     dispatch(orderFilling())
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
  })
}


export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.events.Cancel({}, (error, event) => {
    dispatch(orderCancelled(event.returnValues))
  })

  exchange.events.Trade({}, (error, event) => {
    dispatch(orderFilled(event.returnValues))
  })
}

 
export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  

  try {  

  // Ether balance in wallet
  const etherBalance = await web3.eth.getBalance(account)
  dispatch(etherBalanceLoaded(etherBalance))

  // Token balance in wallet
  const tokenBalance = await token.methods.balanceOf(account).call()
  dispatch(tokenBalanceLoaded(tokenBalance))

  // Ether balance in exchange
  const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
  dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

  // Token balance in exchange
  const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
  dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

  // Trigger all balances loaded
  dispatch(balancesLoaded())

} catch (error) { 
  console.error( `This is the error message ${error}`) 
}
}
export const depositEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.depositEther.send({ from: account,  value: web3.utils.toWei(amount, 'ether') })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  token.methods.approve(exchange.options.address, amount).send({ from: account })
  .on('transactionHash', (hash) => {
    exchange.methods.depositToken(token.options.address, amount).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
  })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}



export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = token.options.address
  const amountGet = web3_utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  const amountGive = web3_utils.toWei((order.amount * order.price).toString(), 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(buyOrderMaking())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS
  const amountGet = web3_utils.toWei((order.amount * order.price).toString(), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3_utils.toWei(order.amount, 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(sellOrderMaking())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

