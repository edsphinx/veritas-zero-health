// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing clinical trial payments
 * @dev Mintable ERC20 for demo purposes only - NOT for production use
 *
 * Features:
 * - 6 decimals (matches real USDC)
 * - Public faucet for easy testing (1000 USDC per address)
 * - Owner can mint arbitrary amounts
 * - Initial supply of 1M USDC minted to deployer
 */
contract MockUSDC is ERC20, Ownable {
    // USDC has 6 decimals, not 18
    uint8 private constant DECIMALS = 6;

    // Initial supply: 1 million USDC
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**DECIMALS;

    // Track faucet claims
    mapping(address => bool) public hasClaimed;

    // Events
    event FaucetClaimed(address indexed claimer, uint256 amount);

    /**
     * @notice Constructor - deploys mock USDC with initial supply
     * @dev Mints 1M USDC to deployer for distribution
     */
    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Mint tokens to specific address
     * @param to Address to receive tokens
     * @param amount Amount to mint (in base units, 6 decimals)
     * @dev Only owner can call this function
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockUSDC: mint to zero address");
        require(amount > 0, "MockUSDC: mint amount must be positive");

        _mint(to, amount);
    }

    /**
     * @notice Public faucet for demo testing
     * @dev Anyone can claim 1000 USDC once per address
     *
     * Usage example:
     * - Patient needs USDC for gas or testing
     * - Researcher needs USDC to fund studies
     * - Just call faucet() and receive 1000 USDC
     */
    function faucet() external {
        require(!hasClaimed[msg.sender], "MockUSDC: Already claimed from faucet");

        uint256 faucetAmount = 1000 * 10**DECIMALS; // 1000 USDC
        hasClaimed[msg.sender] = true;

        _mint(msg.sender, faucetAmount);

        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    /**
     * @notice Override decimals to match real USDC (6 decimals, not 18)
     * @return Number of decimals (6)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn
     * @dev Useful for testing scenarios
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from specific address (requires approval)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    /**
     * @notice Reset faucet claim for testing
     * @param account Address to reset
     * @dev Only owner - useful for test scenarios
     */
    function resetFaucetClaim(address account) external onlyOwner {
        hasClaimed[account] = false;
    }

    /**
     * @notice Batch mint to multiple addresses
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts to mint
     * @dev Useful for setting up test scenarios quickly
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "MockUSDC: Array length mismatch");
        require(recipients.length > 0, "MockUSDC: Empty arrays");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockUSDC: mint to zero address");
            require(amounts[i] > 0, "MockUSDC: mint amount must be positive");

            _mint(recipients[i], amounts[i]);
        }
    }
}
