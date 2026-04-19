import { expect } from "chai";
import { ethers } from "hardhat";

describe("CarnivonToken", () => {
  async function deploy() {
    const [admin, alice, bob] = await ethers.getSigners();

    const Identity = await ethers.getContractFactory("IdentityRegistry");
    const identity = await Identity.deploy(admin.address);

    const Compliance = await ethers.getContractFactory("ComplianceEngine");
    const compliance = await Compliance.deploy(admin.address, await identity.getAddress());

    const Token = await ethers.getContractFactory("CarnivonToken");
    const token = await Token.deploy(
      "Carnivon Brazil Cattle Cycle 01",
      "CVC01",
      admin.address,
      await compliance.getAddress(),
      "Carnivon SPC Ltd",
      "Carnivon Brazil Ltda",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 150 * 86400,
      "10-16%"
    );

    await compliance.grantTokenRole(await token.getAddress());
    return { admin, alice, bob, identity, compliance, token };
  }

  it("mints to verified investor only", async () => {
    const { admin, alice, identity, token } = await deploy();

    // Alice not verified → mint reverts
    await expect(token.mint(alice.address, 100_000)).to.be.revertedWith("compliance");

    // Verify Alice (US accredited)
    await identity.registerIdentity(alice.address, 840, 2, 0);
    await token.mint(alice.address, 100_000);
    expect(await token.balanceOf(alice.address)).to.equal(100_000n);
    expect(await token.decimals()).to.equal(0);
  });

  it("blocks transfers during lockup, allows after unlock", async () => {
    const { alice, bob, identity, compliance, token } = await deploy();

    await identity.registerIdentity(alice.address, 840, 2, 0);
    await identity.registerIdentity(bob.address, 840, 2, 0);
    await token.mint(alice.address, 10_000);

    // Locked by default
    await expect(
      token.connect(alice).transfer(bob.address, 1_000)
    ).to.be.revertedWith("compliance");

    // Unlock by setting unlock timestamp to now
    await compliance.setTransferUnlock(Math.floor(Date.now() / 1000) - 1);
    await token.connect(alice).transfer(bob.address, 1_000);
    expect(await token.balanceOf(bob.address)).to.equal(1_000n);
  });

  it("redeems only after maturity", async () => {
    const { admin, alice, identity, token } = await deploy();
    await identity.registerIdentity(alice.address, 840, 2, 0);
    await token.mint(alice.address, 5_000);

    await expect(token.redeem(alice.address, 5_000)).to.be.revertedWith("not matured");

    await token.setStatus(2); // Matured
    await token.redeem(alice.address, 5_000);
    expect(await token.balanceOf(alice.address)).to.equal(0n);
  });

  it("blocks jurisdictions flagged by compliance", async () => {
    const { alice, identity, compliance, token } = await deploy();
    await compliance.setJurisdictionBlocked(840, true); // Block US
    await identity.registerIdentity(alice.address, 840, 2, 0);
    // Mint bypasses holder jurisdiction check? It does call _isAllowedHolder.
    await expect(token.mint(alice.address, 1_000)).to.be.revertedWith("compliance");
  });
});
