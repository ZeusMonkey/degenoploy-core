import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

import W3_UniswapV2Router02 from '@uniswap/v2-periphery/build/UniswapV2Router02.json';

import {
  AddressProvider,
  Degenopoly,
  DegenopolyNode,
  DegenopolyNodeFamily,
  DegenopolyNodeManager,
  DegenopolyPlayBoard,
} from './../types';

import { waitSeconds, ether, getTimeStamp } from '../helper';

async function getImplementationAddress(proxyAddress: string) {
  const implHex = await ethers.provider.getStorageAt(
    proxyAddress,
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
  );
  return ethers.utils.hexStripZeros(implHex);
}

const deployDegenopoly: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, ethers } = hre;
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  // {
  //   const degenopolyNodeManager = (await ethers.getContract(
  //     'DegenopolyNodeManager',
  //     deployer
  //   )) as DegenopolyNodeManager;
  //   const degenopolyPlayBoard = (await ethers.getContract(
  //     'DegenopolyPlayBoard',
  //     deployer
  //   )) as DegenopolyPlayBoard;

  //   const nodes = await degenopolyNodeManager.getAllNodes();
  //   for (let node of nodes) {
  //     console.log('---->', node);
  //     const degenopolyNode = (await ethers.getContractAt(
  //       'DegenopolyNode',
  //       node,
  //       deployer
  //     )) as DegenopolyNode;
  //     console.log('1---->', node);
  //     const mintRole = await degenopolyNode.MINTER_ROLE();
  //     console.log('2---->', node, mintRole);

  //     if (
  //       !(await degenopolyNode.hasRole(mintRole, degenopolyNodeManager.address))
  //     ) {
  //       console.log('3manager');
  //       await (
  //         await degenopolyNode.grantRole(
  //           mintRole,
  //           degenopolyNodeManager.address
  //         )
  //       ).wait();
  //       console.log('manager');
  //       await waitSeconds(5);
  //     }
  //     if (
  //       !(await degenopolyNode.hasRole(mintRole, degenopolyPlayBoard.address))
  //     ) {
  //       await (
  //         await degenopolyNode.grantRole(mintRole, degenopolyPlayBoard.address)
  //       ).wait();
  //       console.log('board');
  //       await waitSeconds(5);
  //     }
  //   }

  //   const families = await degenopolyNodeManager.getAllNodeFamilies();
  //   for (let family of families) {
  //     console.log('---->', family);
  //     const degenopolyNodeFamily = (await ethers.getContractAt(
  //       'DegenopolyNodeFamily',
  //       family,
  //       deployer
  //     )) as DegenopolyNodeFamily;
  //     const mintRole = await degenopolyNodeFamily.MINTER_ROLE();

  //     if (
  //       !(await degenopolyNodeFamily.hasRole(
  //         mintRole,
  //         degenopolyNodeManager.address
  //       ))
  //     ) {
  //       console.log('------222');
  //       await (
  //         await degenopolyNodeFamily.grantRole(
  //           mintRole,
  //           degenopolyNodeManager.address
  //         )
  //       ).wait();
  //       await waitSeconds(5);
  //     }
  //   }

  //   return;
  // }

  /// UniswapV2Router
  const uniswapV2RouterAddress = '0x073aD32c56fB57038DAd0b9148d34a09a539e18F';
  const uniswapV2Router = await ethers.getContractAt(
    W3_UniswapV2Router02.abi,
    uniswapV2RouterAddress
  );

  /// AddressProvider
  await deploy('AddressProvider', {
    from: deployer.address,
    args: [],
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [],
      },
    },
  });
  const addressProvider = (await ethers.getContract(
    'AddressProvider',
    deployer
  )) as AddressProvider;
  await waitSeconds(1);

  if ((await addressProvider.getTreasury()) != deployer.address) {
    (await addressProvider.setTreasury(deployer.address)).wait();
  }
  await waitSeconds(5);

  /// DegenopolyPlayBoard
  await deploy('DegenopolyPlayBoard', {
    from: deployer.address,
    args: [],
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [addressProvider.address],
      },
    },
  });
  const degenopolyPlayBoard = (await ethers.getContract(
    'DegenopolyPlayBoard',
    deployer
  )) as DegenopolyPlayBoard;
  await waitSeconds(1);

  if (
    (await addressProvider.getDegenopolyPlayBoard()) !=
    degenopolyPlayBoard.address
  ) {
    (
      await addressProvider.setDegenopolyPlayBoard(degenopolyPlayBoard.address)
    ).wait();
    await waitSeconds(5);
  }

  /// DegenopolyNodeManager
  await deploy('DegenopolyNodeManager', {
    from: deployer.address,
    args: [],
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [addressProvider.address],
      },
    },
  });
  const degenopolyNodeManager = (await ethers.getContract(
    'DegenopolyNodeManager',
    deployer
  )) as DegenopolyNodeManager;
  await waitSeconds(1);

  if (
    (await addressProvider.getDegenopolyNodeManager()) !=
    degenopolyNodeManager.address
  ) {
    (
      await addressProvider.setDegenopolyNodeManager(
        degenopolyNodeManager.address
      )
    ).wait();
    await waitSeconds(5);
  }

  /// DegenopolyNode
  const nodes = [
    {
      name: 'Indian Jeet City',
      symbol: 'Indian Jeet City',
      baseTokenURI: '',
      color: 'Brown',
      rewardPerSec: ether(5.25).div(86400),
      purchasePrice: ether(150),
    },
    {
      name: 'Honeypot Land',
      symbol: 'Honeypot Land',
      baseTokenURI: '',
      color: 'Brown',
      rewardPerSec: ether(7).div(86400),
      purchasePrice: ether(200),
    },
    {
      name: 'St Exitscam',
      symbol: 'St Exitscam',
      baseTokenURI: '',
      color: 'Gray',
      rewardPerSec: ether(8.75).div(86400),
      purchasePrice: ether(250),
    },
    {
      name: 'Rug2Riches',
      symbol: 'Rug2Riches',
      baseTokenURI: '',
      color: 'Gray',
      rewardPerSec: ether(10.5).div(86400),
      purchasePrice: ether(300),
    },
    {
      name: 'Softrug Boulevard',
      symbol: 'Softrug Boulevard',
      baseTokenURI: '',
      color: 'Gray',
      rewardPerSec: ether(12.25).div(86400),
      purchasePrice: ether(350),
    },
    {
      name: 'Shitcoin Paradise',
      symbol: 'Shitcoin Paradise',
      baseTokenURI: '',
      color: 'Purple',
      rewardPerSec: ether(14.875).div(86400),
      purchasePrice: ether(425),
    },
    {
      name: 'Pleb VCC',
      symbol: 'Pleb VCC',
      baseTokenURI: '',
      color: 'Purple',
      rewardPerSec: ether(16.625).div(86400),
      purchasePrice: ether(475),
    },
    {
      name: 'Ponzi Farm',
      symbol: 'Ponzi Farm',
      baseTokenURI: '',
      color: 'Orange',
      rewardPerSec: ether(21).div(86400),
      purchasePrice: ether(600),
    },
    {
      name: '$er’s Castle',
      symbol: '$er’s Castle',
      baseTokenURI: '',
      color: 'Orange',
      rewardPerSec: ether(22.75).div(86400),
      purchasePrice: ether(650),
    },
    {
      name: 'Ape Territory',
      symbol: 'Ape Territory',
      baseTokenURI: '',
      color: 'Orange',
      rewardPerSec: ether(24.5).div(86400),
      purchasePrice: ether(700),
    },
    {
      name: 'ICO Graveyard',
      symbol: 'ICO Graveyard',
      baseTokenURI: '',
      color: 'Red',
      rewardPerSec: ether(30.625).div(86400),
      purchasePrice: ether(875),
    },
    {
      name: 'Dinocoins City',
      symbol: 'Dinocoins City',
      baseTokenURI: '',
      color: 'Red',
      rewardPerSec: ether(32.375).div(86400),
      purchasePrice: ether(925),
    },
    {
      name: 'Moonshot Street',
      symbol: 'Moonshot Street',
      baseTokenURI: '',
      color: 'Red',
      rewardPerSec: ether(34.125).div(86400),
      purchasePrice: ether(975),
    },
    {
      name: 'Liquidation Park',
      symbol: 'Liquidation Park',
      baseTokenURI: '',
      color: 'Yellow',
      rewardPerSec: ether(42).div(86400),
      purchasePrice: ether(1200),
    },
    {
      name: 'Gems Kingdom',
      symbol: 'Gems Kingdom',
      baseTokenURI: '',
      color: 'Yellow',
      rewardPerSec: ether(43.75).div(86400),
      purchasePrice: ether(1250),
    },
    {
      name: 'Goblin Town',
      symbol: 'Goblin Town',
      baseTokenURI: '',
      color: 'Blue',
      rewardPerSec: ether(54.25).div(86400),
      purchasePrice: ether(1550),
    },
    {
      name: 'The Citadel',
      symbol: 'The Citadel',
      baseTokenURI: '',
      color: 'Blue',
      rewardPerSec: ether(56).div(86400),
      purchasePrice: ether(1600),
    },
  ];
  let degenopolyNodes: string[] = [];

  for (let node of nodes) {
    await deploy(node.name, {
      contract: 'DegenopolyNode',
      from: deployer.address,
      args: [],
      log: true,
      proxy: {
        proxyContract: 'OpenZeppelinTransparentProxy',
        execute: {
          methodName: 'initialize',
          args: [
            node.name,
            node.symbol,
            node.baseTokenURI,
            node.color,
            addressProvider.address,
            node.rewardPerSec,
            node.purchasePrice,
          ],
        },
      },
    });

    const degenopolyNode = (await ethers.getContract(
      node.name,
      deployer
    )) as DegenopolyNode;
    await waitSeconds(1);

    degenopolyNodes.push(degenopolyNode.address);

    continue;

    const mintRole = await degenopolyNode.MINTER_ROLE();
    if (
      !(await degenopolyNode.hasRole(mintRole, degenopolyNodeManager.address))
    ) {
      console.log('reseting for ', degenopolyNode.address);
      await (
        await degenopolyNode.grantRole(mintRole, degenopolyNodeManager.address)
      ).wait();
      await waitSeconds(5);
    }
    if (
      !(await degenopolyNode.hasRole(mintRole, degenopolyPlayBoard.address))
    ) {
      await (
        await degenopolyNode.grantRole(mintRole, degenopolyPlayBoard.address)
      ).wait();
      await waitSeconds(5);
    }
  }

  /// DegenopolyNodeFamily
  const multiplier = 10000;
  const families = [
    {
      name: 'Brown Family',
      symbol: 'Brown Family',
      baseTokenURI: '',
      color: 'Brown',
      rewardBoost: 1.25 * multiplier,
    },
    {
      name: 'Gray Family',
      symbol: 'Gray Family',
      baseTokenURI: '',
      color: 'Gray',
      rewardBoost: 1.5 * multiplier,
    },
    {
      name: 'Purple Family',
      symbol: 'Purple Family',
      baseTokenURI: '',
      color: 'Purple',
      rewardBoost: 1.75 * multiplier,
    },
    {
      name: 'Orange Family',
      symbol: 'Orange Family',
      baseTokenURI: '',
      color: 'Orange',
      rewardBoost: 2 * multiplier,
    },
    {
      name: 'Red Family',
      symbol: 'Red Family',
      baseTokenURI: '',
      color: 'Red',
      rewardBoost: 2.25 * multiplier,
    },
    {
      name: 'Yellow Family',
      symbol: 'Yellow Family',
      baseTokenURI: '',
      color: 'Yellow',
      rewardBoost: 2.5 * multiplier,
    },
    {
      name: 'Blue Family',
      symbol: 'Blue Family',
      baseTokenURI: '',
      color: 'Blue',
      rewardBoost: 3 * multiplier,
    },
  ];
  let degenpolyNodeFamilies: string[] = [];

  for (let family of families) {
    await deploy(family.name, {
      contract: 'DegenopolyNodeFamily',
      from: deployer.address,
      args: [],
      log: true,
      proxy: {
        proxyContract: 'OpenZeppelinTransparentProxy',
        execute: {
          methodName: 'initialize',
          args: [
            family.name,
            family.symbol,
            family.baseTokenURI,
            family.color,
            family.rewardBoost,
            addressProvider.address,
          ],
        },
      },
    });

    const degenopolyNodeFamily = (await ethers.getContract(
      family.name,
      deployer
    )) as DegenopolyNodeFamily;
    await waitSeconds(1);

    degenpolyNodeFamilies.push(degenopolyNodeFamily.address);

    continue;

    const mintRole = await degenopolyNodeFamily.MINTER_ROLE();
    if (
      !(await degenopolyNodeFamily.hasRole(
        mintRole,
        degenopolyNodeManager.address
      ))
    ) {
      console.log('reseting for ', degenopolyNodeFamily.address);
      await (
        await degenopolyNodeFamily.grantRole(
          mintRole,
          degenopolyNodeManager.address
        )
      ).wait();
      await waitSeconds(5);
    }
  }

  /// Degenopoly
  await deploy('Degenopoly', {
    from: deployer.address,
    args: [],
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [addressProvider.address, uniswapV2Router.address],
      },
    },
  });
  const degenopoly = (await ethers.getContract(
    'Degenopoly',
    deployer
  )) as Degenopoly;
  await waitSeconds(1);

  if ((await addressProvider.getDegenopoly()) != degenopoly.address) {
    (await addressProvider.setDegenopoly(degenopoly.address)).wait();
    await waitSeconds(5);
  }
  {
    const mintRole = await degenopoly.MINTER_ROLE();
    if (!(await degenopoly.hasRole(mintRole, degenopolyNodeManager.address))) {
      console.log('reseting for ', degenopoly.address);
      await (
        await degenopoly.grantRole(mintRole, degenopolyNodeManager.address)
      ).wait();
      await waitSeconds(5);
    }
    if (!(await degenopoly.hasRole(mintRole, degenopolyPlayBoard.address))) {
      await (
        await degenopoly.grantRole(mintRole, degenopolyPlayBoard.address)
      ).wait();
      await waitSeconds(5);
    }
  }

  /// Configuration of DegenopolyPlayBoard
  const cases = [
    {
      caseType: 0,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[0]]
      ),
    },
    {
      caseType: 1,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[1]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[2]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[3]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[4]]
      ),
    },
    {
      caseType: 1,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[5]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[6]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[7]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[8]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[9]]
      ),
    },
    {
      caseType: 1,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[10]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[11]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[12]]
      ),
    },
    {
      caseType: 1,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[13]]
      ),
    },
    {
      caseType: 2,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[14]]
      ),
    },
    {
      caseType: 1,
      info: '0x00',
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[15]]
      ),
    },
    {
      caseType: 3,
      info: ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [degenopolyNodes[16]]
      ),
    },
  ];
  if ((await degenopolyPlayBoard.getPlayboardCases()).length == 0) {
    await (await degenopolyPlayBoard.setCases(cases)).wait();
    await waitSeconds(5);
  }

  /// Configuration of DegenopolyNodeManager
  if ((await degenopolyNodeManager.getAllNodes()).length == 0) {
    await (await degenopolyNodeManager.addNodes(degenopolyNodes)).wait();
    await waitSeconds(5);
  }
  if ((await degenopolyNodeManager.getAllNodeFamilies()).length == 0) {
    await (
      await degenopolyNodeManager.addNodeFamilies(degenpolyNodeFamilies)
    ).wait();
    await waitSeconds(5);
  }

  /// Configuration of Degenopoly
  const degenopolyAmount = ether(10000);
  const ethAmount = ether(10);
  const deadline = (await getTimeStamp()) + 3600;

  await degenopoly.approve(
    uniswapV2Router.address,
    ethers.constants.MaxUint256
  );
  await waitSeconds(5);

  await uniswapV2Router.addLiquidityETH(
    degenopoly.address,
    degenopolyAmount,
    0,
    0,
    deployer.address,
    deadline,
    { value: ethAmount }
  );
  await waitSeconds(5);

  /// Verify
  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    console.log('=====> Verifing ....');

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(addressProvider.address),
        contract: 'contracts/libraries/AddressProvider.sol:AddressProvider',
        constructorArguments: [],
      });
    } catch (_) {}

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(degenopolyPlayBoard.address),
        contract: 'contracts/game/DegenopolyPlayBoard.sol:DegenopolyPlayBoard',
        constructorArguments: [],
      });
    } catch (_) {}

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(degenopolyNodeManager.address),
        contract:
          'contracts/nft/DegenopolyNodeManager.sol:DegenopolyNodeManager',
        constructorArguments: [],
      });
    } catch (_) {}

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(degenpolyNodeFamilies[0]),
        contract: 'contracts/nft/DegenopolyNodeFamily.sol:DegenopolyNodeFamily',
        constructorArguments: [],
      });
    } catch (_) {}

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(degenopolyNodes[0]),
        contract: 'contracts/nft/DegenopolyNode.sol:DegenopolyNode',
        constructorArguments: [],
      });
    } catch (_) {}

    await waitSeconds(10);
    try {
      await hre.run('verify:verify', {
        address: await getImplementationAddress(degenopoly.address),
        contract: 'contracts/token/Degenopoly.sol:Degenopoly',
        constructorArguments: [],
      });
    } catch (_) {}
  }
};

export default deployDegenopoly;
deployDegenopoly.tags = ['DegenopolyTest'];
deployDegenopoly.dependencies = [];
