import { ethers } from "hardhat";

/**
 * Deploys a full CVC01 stack:
 *   IdentityRegistry → ComplianceEngine → CarnivonToken
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Identity = await ethers.getContractFactory("IdentityRegistry");
  const identity = await Identity.deploy(deployer.address);
  await identity.waitForDeployment();
  console.log("IdentityRegistry:", await identity.getAddress());

  const Compliance = await ethers.getContractFactory("ComplianceEngine");
  const compliance = await Compliance.deploy(deployer.address, await identity.getAddress());
  await compliance.waitForDeployment();
  console.log("ComplianceEngine:", await compliance.getAddress());

  const Token = await ethers.getContractFactory("CarnivonToken");
  const token = await Token.deploy(
    "Carnivon Brazil Cattle Cycle 01",
    "CVC01",
    deployer.address,
    await compliance.getAddress(),
    "Carnivon SPC Ltd",
    "Carnivon Brazil Ltda",
    Math.floor(new Date("2026-06-01").getTime() / 1000),
    Math.floor(new Date("2026-10-29").getTime() / 1000),
    "10-16%"
  );
  await token.waitForDeployment();
  console.log("CarnivonToken:", await token.getAddress());

  // Wire the token address into compliance so it can gate the transferred hook
  const tx = await compliance.grantTokenRole(await token.getAddress());
  await tx.wait();
  console.log("Compliance granted TOKEN_ROLE to token");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
