pragma solidity ^0.5.0;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token { 
	using SafeMath for uint;

	// Variables 
	string public name = "Meitnerium";
	string public symbol = 'MET';
	uint256 public decimals = 18;
	uint256 public totalSupply;
	//Track balances 
	mapping(address => uint256) public balanceOf;
	mapping(address => mapping(address => uint256)) public allowance;

	// Events 
	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(address indexed owner, address indexed spender, uint256 value);
	
	//Send tokens
	constructor() public {
		totalSupply = 1000000 * (10 ** decimals);
		balanceOf[msg.sender] = totalSupply;
	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		// the value of the transfer should be available on the deployers account 
		require(balanceOf[msg.sender] >= _value);
		_transfer(msg.sender, _to, _value);
		return true;
	}

	function _transfer(address _from, address _to, uint256 _value) internal {
		// it requires a valid address 
		require(_to != address(0));
		balanceOf[_from] = balanceOf[_from].sub(_value);
		balanceOf[_to] = balanceOf[_to].add(_value);
		// We trigger event
		emit Transfer(_from, _to, _value);
	}

	// Approve tokens
	function approve( address _spender, uint256 _value) public returns (bool success) {
			// it requires a valid address 
		require(_spender != address(0));
		allowance[msg.sender][_spender] = _value;
		emit Approval(msg.sender, _spender, _value );
		return true;
	}

	// Transfer from

	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		require(_value <= balanceOf[_from]);
		require(_value <= allowance[_from][msg.sender]);
		allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
		_transfer(_from, _to, _value);
		return true;
	}
	

}
