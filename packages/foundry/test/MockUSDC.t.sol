// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/mocks/MockUSDC.sol";

contract MockUSDCTest is Test {
    MockUSDC public usdc;
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    // Constants for easier testing
    uint256 constant DECIMALS = 6;
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10**DECIMALS;
    uint256 constant FAUCET_AMOUNT = 1000 * 10**DECIMALS;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        usdc = new MockUSDC();
    }

    // ============ Deployment Tests ============

    function test_Deployment() public {
        assertEq(usdc.name(), "Mock USDC");
        assertEq(usdc.symbol(), "mUSDC");
        assertEq(usdc.decimals(), 6);
        assertEq(usdc.totalSupply(), INITIAL_SUPPLY);
        assertEq(usdc.balanceOf(owner), INITIAL_SUPPLY);
    }

    function test_InitialSupply() public {
        // Owner should have 1M USDC
        assertEq(usdc.balanceOf(owner), 1_000_000 * 10**6);
    }

    function test_Decimals() public {
        // USDC has 6 decimals, not 18 like most ERC20s
        assertEq(usdc.decimals(), 6);
    }

    // ============ Faucet Tests ============

    function test_Faucet_Success() public {
        vm.prank(user1);
        usdc.faucet();

        assertEq(usdc.balanceOf(user1), FAUCET_AMOUNT);
        assertTrue(usdc.hasClaimed(user1));
    }

    function test_Faucet_CanOnlyClaimOnce() public {
        vm.startPrank(user1);

        // First claim succeeds
        usdc.faucet();
        assertEq(usdc.balanceOf(user1), FAUCET_AMOUNT);

        // Second claim should fail
        vm.expectRevert("MockUSDC: Already claimed from faucet");
        usdc.faucet();

        vm.stopPrank();
    }

    function test_Faucet_MultipleUsersCanClaim() public {
        // User 1 claims
        vm.prank(user1);
        usdc.faucet();
        assertEq(usdc.balanceOf(user1), FAUCET_AMOUNT);

        // User 2 claims
        vm.prank(user2);
        usdc.faucet();
        assertEq(usdc.balanceOf(user2), FAUCET_AMOUNT);

        // User 3 claims
        vm.prank(user3);
        usdc.faucet();
        assertEq(usdc.balanceOf(user3), FAUCET_AMOUNT);

        // Total supply increased correctly
        assertEq(usdc.totalSupply(), INITIAL_SUPPLY + (FAUCET_AMOUNT * 3));
    }

    function test_Faucet_EmitsEvent() public {
        vm.prank(user1);

        vm.expectEmit(true, false, false, true);
        emit MockUSDC.FaucetClaimed(user1, FAUCET_AMOUNT);

        usdc.faucet();
    }

    // ============ Mint Tests ============

    function test_Mint_Success() public {
        uint256 mintAmount = 5000 * 10**DECIMALS;

        usdc.mint(user1, mintAmount);

        assertEq(usdc.balanceOf(user1), mintAmount);
        assertEq(usdc.totalSupply(), INITIAL_SUPPLY + mintAmount);
    }

    function test_Mint_OnlyOwner() public {
        uint256 mintAmount = 1000 * 10**DECIMALS;

        vm.prank(user1);
        vm.expectRevert();
        usdc.mint(user1, mintAmount);
    }

    function test_Mint_RevertOnZeroAddress() public {
        vm.expectRevert("MockUSDC: mint to zero address");
        usdc.mint(address(0), 1000 * 10**DECIMALS);
    }

    function test_Mint_RevertOnZeroAmount() public {
        vm.expectRevert("MockUSDC: mint amount must be positive");
        usdc.mint(user1, 0);
    }

    // ============ Batch Mint Tests ============

    function test_BatchMint_Success() public {
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10**DECIMALS;
        amounts[1] = 200 * 10**DECIMALS;
        amounts[2] = 300 * 10**DECIMALS;

        usdc.batchMint(recipients, amounts);

        assertEq(usdc.balanceOf(user1), 100 * 10**DECIMALS);
        assertEq(usdc.balanceOf(user2), 200 * 10**DECIMALS);
        assertEq(usdc.balanceOf(user3), 300 * 10**DECIMALS);
    }

    function test_BatchMint_RevertOnArrayLengthMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10**DECIMALS;
        amounts[1] = 200 * 10**DECIMALS;
        amounts[2] = 300 * 10**DECIMALS;

        vm.expectRevert("MockUSDC: Array length mismatch");
        usdc.batchMint(recipients, amounts);
    }

    function test_BatchMint_RevertOnEmptyArrays() public {
        address[] memory recipients = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.expectRevert("MockUSDC: Empty arrays");
        usdc.batchMint(recipients, amounts);
    }

    function test_BatchMint_OnlyOwner() public {
        address[] memory recipients = new address[](1);
        recipients[0] = user1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100 * 10**DECIMALS;

        vm.prank(user1);
        vm.expectRevert();
        usdc.batchMint(recipients, amounts);
    }

    // ============ Burn Tests ============

    function test_Burn_Success() public {
        uint256 burnAmount = 100_000 * 10**DECIMALS;

        usdc.burn(burnAmount);

        assertEq(usdc.balanceOf(owner), INITIAL_SUPPLY - burnAmount);
        assertEq(usdc.totalSupply(), INITIAL_SUPPLY - burnAmount);
    }

    function test_BurnFrom_Success() public {
        uint256 burnAmount = 500 * 10**DECIMALS;

        // Mint to user1
        usdc.mint(user1, 1000 * 10**DECIMALS);

        // User1 approves user2 to burn
        vm.prank(user1);
        usdc.approve(user2, burnAmount);

        // User2 burns from user1
        vm.prank(user2);
        usdc.burnFrom(user1, burnAmount);

        assertEq(usdc.balanceOf(user1), 500 * 10**DECIMALS);
    }

    // ============ Reset Faucet Tests ============

    function test_ResetFaucetClaim_Success() public {
        // User1 claims
        vm.prank(user1);
        usdc.faucet();
        assertTrue(usdc.hasClaimed(user1));

        // Owner resets user1's claim
        usdc.resetFaucetClaim(user1);
        assertFalse(usdc.hasClaimed(user1));

        // User1 can claim again
        vm.prank(user1);
        usdc.faucet();
        assertEq(usdc.balanceOf(user1), FAUCET_AMOUNT * 2);
    }

    function test_ResetFaucetClaim_OnlyOwner() public {
        vm.prank(user1);
        usdc.faucet();

        vm.prank(user2);
        vm.expectRevert();
        usdc.resetFaucetClaim(user1);
    }

    // ============ Transfer Tests ============

    function test_Transfer_Success() public {
        uint256 transferAmount = 1000 * 10**DECIMALS;

        usdc.transfer(user1, transferAmount);

        assertEq(usdc.balanceOf(user1), transferAmount);
        assertEq(usdc.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
    }

    function test_TransferFrom_Success() public {
        uint256 transferAmount = 1000 * 10**DECIMALS;

        // Owner approves user1 to spend
        usdc.approve(user1, transferAmount);

        // User1 transfers from owner to user2
        vm.prank(user1);
        usdc.transferFrom(owner, user2, transferAmount);

        assertEq(usdc.balanceOf(user2), transferAmount);
        assertEq(usdc.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
    }

    // ============ Real-World Scenario Tests ============

    function test_Scenario_FundClinicalTrial() public {
        // Scenario: Researcher needs to fund a clinical trial
        address researcher = address(0x100);
        address escrowContract = address(0x200);

        // Researcher claims from faucet
        vm.prank(researcher);
        usdc.faucet();
        assertEq(usdc.balanceOf(researcher), FAUCET_AMOUNT);

        // Not enough, so owner mints more for researcher
        usdc.mint(researcher, 10_000 * 10**DECIMALS);
        assertEq(usdc.balanceOf(researcher), 11_000 * 10**DECIMALS);

        // Researcher approves escrow to spend
        vm.prank(researcher);
        usdc.approve(escrowContract, 10_000 * 10**DECIMALS);

        // Escrow pulls funds
        vm.prank(escrowContract);
        usdc.transferFrom(researcher, escrowContract, 10_000 * 10**DECIMALS);

        assertEq(usdc.balanceOf(escrowContract), 10_000 * 10**DECIMALS);
        assertEq(usdc.balanceOf(researcher), 1_000 * 10**DECIMALS);
    }

    function test_Scenario_PayMultipleParticipants() public {
        address escrow = address(0x300);
        address patient1 = address(0x401);
        address patient2 = address(0x402);
        address patient3 = address(0x403);

        uint256 paymentPerPatient = 250 * 10**DECIMALS;

        // Setup: Mint to escrow
        usdc.mint(escrow, 10_000 * 10**DECIMALS);

        // Escrow pays patient 1
        vm.prank(escrow);
        usdc.transfer(patient1, paymentPerPatient);
        assertEq(usdc.balanceOf(patient1), paymentPerPatient);

        // Escrow pays patient 2
        vm.prank(escrow);
        usdc.transfer(patient2, paymentPerPatient);
        assertEq(usdc.balanceOf(patient2), paymentPerPatient);

        // Escrow pays patient 3
        vm.prank(escrow);
        usdc.transfer(patient3, paymentPerPatient);
        assertEq(usdc.balanceOf(patient3), paymentPerPatient);

        // Escrow remaining balance
        assertEq(usdc.balanceOf(escrow), 10_000 * 10**DECIMALS - (paymentPerPatient * 3));
    }

    // ============ Fuzz Tests ============

    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount > 0);
        vm.assume(amount < type(uint256).max / 2); // Prevent overflow

        usdc.mint(to, amount);

        assertEq(usdc.balanceOf(to), amount);
    }

    function testFuzz_Transfer(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount > 0 && amount <= INITIAL_SUPPLY);

        usdc.transfer(to, amount);

        assertEq(usdc.balanceOf(to), amount);
        assertEq(usdc.balanceOf(owner), INITIAL_SUPPLY - amount);
    }
}
