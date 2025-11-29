import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedStorage = await deploy("ObscuraStorage", {
    from: deployer,
    log: true,
  });

  console.log(`ObscuraStorage contract: `, deployedStorage.address);
};
export default func;
func.id = "deploy_obscuraStorage"; // id required to prevent reexecution
func.tags = ["ObscuraStorage"];
