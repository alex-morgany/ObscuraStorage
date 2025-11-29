import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("task:storage:address", "Prints the ObscuraStorage address").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const deployment = await deployments.get("ObscuraStorage");
  console.log(`ObscuraStorage address: ${deployment.address}`);
});

task("task:storage:list", "Lists encrypted file records for an address")
  .addOptionalParam("user", "Address to inspect (defaults to deployer)")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers } = hre;
    const deployment = await deployments.get("ObscuraStorage");
    const contract = await ethers.getContractAt("ObscuraStorage", deployment.address);
    const address = args.user ?? (await (await ethers.getSigners())[0].getAddress());

    const records = await contract.getRecords(address);
    if (!records.length) {
      console.log(`No encrypted files stored for ${address}`);
      return;
    }

    console.log(`Encrypted files stored for ${address}:`);
    records.forEach((record: any, index: number) => {
      console.log(`- #${index} ${record.fileName} | encHash=${record.encryptedHash} | keyHandle=${record.encryptedKey}`);
    });
  });

task("task:storage:store", "Stores an encrypted file record")
  .addParam("file", "Original file name to display")
  .addParam("payload", "Encrypted hash payload generated client-side")
  .addParam("key", "12-digit symmetric key used to encrypt the payload")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    const deployment = await deployments.get("ObscuraStorage");
    const signers = await ethers.getSigners();

    await fhevm.initializeCLIApi();

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signers[0].address)
      .add64(BigInt(args.key))
      .encrypt();

    const contract = await ethers.getContractAt("ObscuraStorage", deployment.address);
    const tx = await contract
      .connect(signers[0])
      .storeFile(args.file, args.payload, encryptedInput.handles[0], encryptedInput.inputProof);

    console.log(`Wait for tx ${tx.hash} ...`);
    await tx.wait();
    console.log("Stored encrypted file successfully");
  });

task("task:storage:decrypt", "Decrypts a stored key handle (mock net only)")
  .addParam("index", "Record index to decrypt")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;

    if (!fhevm.isMock) {
      throw new Error("Decryption via task is available only on mock network");
    }

    const deployment = await deployments.get("ObscuraStorage");
    const contract = await ethers.getContractAt("ObscuraStorage", deployment.address);
    const records = await contract.getRecords((await ethers.getSigners())[0].address);

    const index = Number(args.index);
    if (index < 0 || index >= records.length) {
      throw new Error("Index out of bounds");
    }

    const ciphertext = records[index].encryptedKey;
    const signer = (await ethers.getSigners())[0];

    const key = await fhevm.userDecryptEuint(FhevmType.euint64, ciphertext, deployment.address, signer);
    console.log(`Decrypted symmetric key for record #${index}: ${key.toString()}`);
  });
