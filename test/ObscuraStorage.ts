import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ObscuraStorage, ObscuraStorage__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("ObscuraStorage", () => {
  let deployer: HardhatEthersSigner;
  let storage: ObscuraStorage;
  let storageAddress: string;

  before(async () => {
    [deployer] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("ObscuraStorage unit tests can run only against the FHEVM mock");
      this.skip();
    }

    const factory = (await ethers.getContractFactory("ObscuraStorage")) as ObscuraStorage__factory;
    storage = (await factory.deploy()) as ObscuraStorage;
    storageAddress = await storage.getAddress();
  });

  it("stores encrypted file references and allows retrieving metadata", async () => {
    const encryptedHash = "deadbeefcafebabe";

    const encryptedInput = await fhevm.createEncryptedInput(storageAddress, deployer.address).add64(123456789012).encrypt();

    await expect(
      storage.connect(deployer).storeFile("passport.pdf", encryptedHash, encryptedInput.handles[0], encryptedInput.inputProof),
    )
      .to.emit(storage, "FileStored")
      .withArgs(deployer.address, 0, "passport.pdf", encryptedHash, anyValue);

    const count = await storage.getRecordCount(deployer.address);
    expect(count).to.equal(1n);

    const storedRecord = await storage.getRecord(deployer.address, 0);
    expect(storedRecord.fileName).to.equal("passport.pdf");
    expect(storedRecord.encryptedHash).to.equal(encryptedHash);

    const decryptedKey = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      storedRecord.encryptedKey,
      storageAddress,
      deployer,
    );

    expect(decryptedKey.toString()).to.equal("123456789012");

    const records = await storage.getRecords(deployer.address);
    expect(records.length).to.equal(1);
    expect(records[0].timestamp).to.not.equal(0n);
  });
});
