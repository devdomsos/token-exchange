export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
export const GREEN = 'success'
export const RED = 'danger'
// Format ether in helper without pulling in web3 
export const DECIMALS = (10**18)

// Shortcut to avoid passing around web3 connection
export const ether = (wei) => {
  if(wei) {
    return(wei / DECIMALS) // 18 decimal places
  }
}

// export const ether = (n) => {
// 	return new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'))
// }

// Tokens and ether havesame decimal resolution
export const tokens = (n) => ether(n)


export const formatBalance = (balance) => {
	const precision = 100 // 2 decimal places
	balance = ether(balance)
	balance = Math.round(balance * precision) / 100 
	return balance
}