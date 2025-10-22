#!/bin/bash

# Verify all deployed contracts on Optimism Sepolia
# Deployment addresses from 11155420_latest.json

echo "🔍 Verifying all contracts on Optimism Sepolia..."
echo ""

# Read deployment file
DEPLOYMENT_FILE="deployments/11155420_latest.json"

# Extract addresses
MOCK_USDC=$(jq -r '.MockUSDC' $DEPLOYMENT_FILE)
HUMAN_PASSPORT=$(jq -r '.humanPassport' $DEPLOYMENT_FILE)
PROVIDER_REGISTRY=$(jq -r '.providerRegistry' $DEPLOYMENT_FILE)
HEALTH_IDENTITY=$(jq -r '.healthIdentity' $DEPLOYMENT_FILE)
ACCOUNT_FACTORY=$(jq -r '.accountFactory' $DEPLOYMENT_FILE)
PARTICIPATION_SBT=$(jq -r '.participationSBT' $DEPLOYMENT_FILE)
ENROLLMENT_DATA=$(jq -r '.enrollmentData' $DEPLOYMENT_FILE)
ELIGIBILITY_VERIFIER=$(jq -r '.eligibilityVerifier' $DEPLOYMENT_FILE)
STUDY_REGISTRY=$(jq -r '.studyRegistry' $DEPLOYMENT_FILE)
RESEARCH_ESCROW=$(jq -r '.researchEscrow' $DEPLOYMENT_FILE)
VAULT_FACTORY=$(jq -r '.vaultFactory' $DEPLOYMENT_FILE)
STUDY_ACCESS_NFT=$(jq -r '.studyAccessNFT' $DEPLOYMENT_FILE)
COMPLIANCE_SCORE=$(jq -r '.complianceScore' $DEPLOYMENT_FILE)

echo "📝 Contract Addresses:"
echo "MockUSDC: $MOCK_USDC"
echo "MockHumanPassport: $HUMAN_PASSPORT"
echo "MedicalProviderRegistry: $PROVIDER_REGISTRY"
echo "HealthIdentitySBT: $HEALTH_IDENTITY"
echo "PatientAccountFactory: $ACCOUNT_FACTORY"
echo "StudyParticipationSBT: $PARTICIPATION_SBT"
echo "StudyEnrollmentData: $ENROLLMENT_DATA"
echo "EligibilityCodeVerifier: $ELIGIBILITY_VERIFIER"
echo "StudyRegistry: $STUDY_REGISTRY"
echo "ResearchFundingEscrow: $RESEARCH_ESCROW"
echo "CommitmentVaultFactory: $VAULT_FACTORY"
echo "StudyAccessNFT: $STUDY_ACCESS_NFT"
echo "ComplianceScore: $COMPLIANCE_SCORE"
echo ""

# Verify each contract
echo "1/13 Verifying MockUSDC..."
forge verify-contract $MOCK_USDC contracts/mocks/MockUSDC.sol:MockUSDC --chain optimism-sepolia --watch

echo "2/13 Verifying MockHumanPassport..."
forge verify-contract $HUMAN_PASSPORT contracts/mocks/MockHumanPassport.sol:MockHumanPassport --chain optimism-sepolia --watch

echo "3/13 Verifying MedicalProviderRegistry..."
forge verify-contract $PROVIDER_REGISTRY contracts/core/MedicalProviderRegistry.sol:MedicalProviderRegistry --chain optimism-sepolia --watch

echo "4/13 Verifying HealthIdentitySBT..."
forge verify-contract $HEALTH_IDENTITY contracts/core/HealthIdentitySBT.sol:HealthIdentitySBT --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address)" $HUMAN_PASSPORT) --watch

echo "5/13 Verifying PatientAccountFactory..."
forge verify-contract $ACCOUNT_FACTORY contracts/core/PatientAccountFactory.sol:PatientAccountFactory --chain optimism-sepolia --watch

echo "6/13 Verifying StudyParticipationSBT..."
forge verify-contract $PARTICIPATION_SBT contracts/studies/StudyParticipationSBT.sol:StudyParticipationSBT --chain optimism-sepolia --watch

DEPLOYER=$(jq -r '.deployer' $DEPLOYMENT_FILE)
echo "7/13 Verifying StudyEnrollmentData..."
forge verify-contract $ENROLLMENT_DATA contracts/studies/StudyEnrollmentData.sol:StudyEnrollmentData --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address,address)" $PARTICIPATION_SBT $DEPLOYER) --watch

echo "8/13 Verifying EligibilityCodeVerifier..."
forge verify-contract $ELIGIBILITY_VERIFIER contracts/zk/EligibilityCodeVerifier.sol:Groth16Verifier --chain optimism-sepolia --watch

echo "9/13 Verifying StudyRegistry..."
forge verify-contract $STUDY_REGISTRY contracts/studies/StudyRegistry.sol:StudyRegistry --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address)" $ELIGIBILITY_VERIFIER) --watch

echo "10/13 Verifying ResearchFundingEscrow..."
forge verify-contract $RESEARCH_ESCROW contracts/funding/ResearchFundingEscrow.sol:ResearchFundingEscrow --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address)" $PROVIDER_REGISTRY) --watch

echo "11/13 Verifying CommitmentVaultFactory..."
forge verify-contract $VAULT_FACTORY contracts/funding/CommitmentVaultFactory.sol:CommitmentVaultFactory --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address)" $ENROLLMENT_DATA) --watch

echo "12/13 Verifying StudyAccessNFT..."
forge verify-contract $STUDY_ACCESS_NFT contracts/nft/StudyAccessNFT.sol:StudyAccessNFT --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(string,string,address)" "DASHI Study Access" "DASHI-ACCESS" $DEPLOYER) --watch

echo "13/13 Verifying ComplianceScore..."
forge verify-contract $COMPLIANCE_SCORE contracts/studies/ComplianceScore.sol:ComplianceScore --chain optimism-sepolia --constructor-args $(cast abi-encode "constructor(address,address)" $PARTICIPATION_SBT $ENROLLMENT_DATA) --watch

echo ""
echo "✅ All contracts verified!"
