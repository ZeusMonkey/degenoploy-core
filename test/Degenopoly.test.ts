import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';
import W3_UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import W3_UniswapV2Router02 from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import W3_UniswapV2Pair from '@uniswap/v2-core/build/UniswapV2Pair.json';

import { getTimeStamp, ether, increaseTime, getLatestBlock } from '../helper';

import {
  Degenopoly,
  DegenopolyNode,
  DegenopolyNodeFamily,
  DegenopolyNodeManager,
  MockDegenopolyPlayBoard,
  AddressProvider,
  WETH9,
} from '../types';

describe('Degenopoly', function () {
  let deployer: SignerWithAddress;
  let trader: SignerWithAddress;
  let holder: SignerWithAddress;

  let uniswapv2Factory: Contract;
  let uniswapv2Router: Contract;
  let uniswapv2Pair: Contract;
  let weth: WETH9;

  let addressProvider: AddressProvider;
  let degenopolyPlayBoard: MockDegenopolyPlayBoard;
  let degenopolyNodeManager: DegenopolyNodeManager;
  let degenopolyNodes: DegenopolyNode[] = [];
  let degenopolyNodeFamilies: DegenopolyNodeFamily[] = [];
  let degenopoly: Degenopoly;

  let ethAmount = ethers.utils.parseEther('100');
  let degenopolyAmount = ethers.utils.parseEther('100000');
  let multiplier = 10000;

  beforeEach(async function () {
    [deployer, trader, holder] = await ethers.getSigners();
    /// WETH
    const WETH = await ethers.getContractFactory('WETH9');
    weth = (await WETH.deploy()) as WETH9;

    /// UniswapV2Factory
    const UniswapV2FactoryContract = await ethers.getContractFactory(
      W3_UniswapV2Factory.abi,
      W3_UniswapV2Factory.bytecode
    );
    const deployedUniswapV2Factory = await UniswapV2FactoryContract.deploy(
      deployer.address
    );

    await deployedUniswapV2Factory.deployed();

    uniswapv2Factory = await ethers.getContractAt(
      W3_UniswapV2Factory.abi,
      deployedUniswapV2Factory.address
    );

    /// UniswapV2Router
    const UniswapV2RouterContract = await ethers.getContractFactory(
      W3_UniswapV2Router02.abi,
      W3_UniswapV2Router02.bytecode
    );
    const deployedUniswapV2Router = await UniswapV2RouterContract.deploy(
      uniswapv2Factory.address,
      weth.address
    );

    await deployedUniswapV2Router.deployed();

    uniswapv2Router = await ethers.getContractAt(
      W3_UniswapV2Router02.abi,
      deployedUniswapV2Router.address
    );

    /// AddressProvider
    const AddressProvider = await ethers.getContractFactory('AddressProvider');
    await upgrades.silenceWarnings();
    addressProvider = (await upgrades.deployProxy(AddressProvider, [], {
      unsafeAllow: ['delegatecall'],
    })) as AddressProvider;
    await addressProvider.setTreasury(deployer.address);

    /// DegenopolyPlayBoard
    const DegenopolyPlayBoard = await ethers.getContractFactory(
      'MockDegenopolyPlayBoard'
    );
    await upgrades.silenceWarnings();
    degenopolyPlayBoard = (await upgrades.deployProxy(
      DegenopolyPlayBoard,
      [addressProvider.address],
      {
        unsafeAllow: ['delegatecall'],
      }
    )) as MockDegenopolyPlayBoard;
    await addressProvider.setDegenopolyPlayBoard(degenopolyPlayBoard.address);

    /// DegenopolyNodeManager
    const DegenopolyNodeManager = await ethers.getContractFactory(
      'DegenopolyNodeManager'
    );
    await upgrades.silenceWarnings();
    degenopolyNodeManager = (await upgrades.deployProxy(
      DegenopolyNodeManager,
      [addressProvider.address],
      {
        unsafeAllow: ['delegatecall'],
      }
    )) as DegenopolyNodeManager;
    await addressProvider.setDegenopolyNodeManager(
      degenopolyNodeManager.address
    );

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
        color: 'Yello',
        rewardPerSec: ether(42).div(86400),
        purchasePrice: ether(1200),
      },
      {
        name: 'Gems Kingdom',
        symbol: 'Gems Kingdom',
        baseTokenURI: '',
        color: 'Yello',
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
    degenopolyNodes = [];
    const DegenopolyNode = await ethers.getContractFactory('DegenopolyNode');
    for (let node of nodes) {
      degenopolyNodes.push(
        (await upgrades.deployProxy(
          DegenopolyNode,
          [
            node.name,
            node.symbol,
            node.baseTokenURI,
            node.color,
            addressProvider.address,
            node.rewardPerSec,
            node.purchasePrice,
          ],
          {
            unsafeAllow: ['delegatecall'],
          }
        )) as DegenopolyNode
      );
    }
    await degenopolyNodeManager.addNodes(
      degenopolyNodes.map((node) => node.address)
    );

    /// DegenopolyNodeFamily
    const families = [
      {
        name: 'Brown Family',
        symbol: 'Brown Family',
        baseTokenURI: '',
        color: 'Brown',
        rewardBoost: 1.25 * multiplier,
      },
      {
        name: 'Grey Family',
        symbol: 'Grey Family',
        baseTokenURI: '',
        color: 'Grey',
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
    degenopolyNodeFamilies = [];
    const DegenopolyNodeFamily = await ethers.getContractFactory(
      'DegenopolyNodeFamily'
    );
    for (let family of families) {
      degenopolyNodeFamilies.push(
        (await upgrades.deployProxy(
          DegenopolyNodeFamily,
          [
            family.name,
            family.symbol,
            family.baseTokenURI,
            family.color,
            family.rewardBoost,
            addressProvider.address,
          ],
          {
            unsafeAllow: ['delegatecall'],
          }
        )) as DegenopolyNodeFamily
      );
    }
    await degenopolyNodeManager.addNodeFamilies(
      degenopolyNodeFamilies.map((family) => family.address)
    );

    /// Degenopoly
    const Degenopoly = await ethers.getContractFactory('Degenopoly');
    await upgrades.silenceWarnings();
    degenopoly = (await upgrades.deployProxy(
      Degenopoly,
      [addressProvider.address, uniswapv2Router.address],
      {
        unsafeAllow: ['delegatecall'],
      }
    )) as Degenopoly;
    await addressProvider.setDegenopoly(degenopoly.address);

    /// Cases
    const cases = [
      {
        caseType: 0,
        info: '0x00',
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[0].address]
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
          [degenopolyNodes[1].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[2].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[3].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[4].address]
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
          [degenopolyNodes[5].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[6].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[7].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[8].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[9].address]
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
          [degenopolyNodes[10].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[11].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[12].address]
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
          [degenopolyNodes[13].address]
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
          [degenopolyNodes[14].address]
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
          [degenopolyNodes[15].address]
        ),
      },
      {
        caseType: 3,
        info: ethers.utils.defaultAbiCoder.encode(
          ['address'],
          [degenopolyNodes[16].address]
        ),
      },
    ];
    await degenopolyPlayBoard.setCases(cases);

    /// Add Liquidity
    const deadline = (await getTimeStamp()) + 3600;
    await degenopoly.approve(
      uniswapv2Router.address,
      ethers.constants.MaxUint256
    );
    await uniswapv2Router.addLiquidityETH(
      degenopoly.address,
      degenopolyAmount,
      0,
      0,
      deployer.address,
      deadline,
      { value: ethAmount }
    );
    uniswapv2Pair = await ethers.getContractAt(
      W3_UniswapV2Pair.abi,
      await uniswapv2Factory.getPair(degenopoly.address, weth.address)
    );
  });

  describe('#configuration', () => {
    it('address provider', async function () {
      expect(await addressProvider.getTreasury()).equal(deployer.address);
      expect(await addressProvider.getDegenopoly()).equal(degenopoly.address);
      expect(await addressProvider.getDegenopolyNodeManager()).equal(
        degenopolyNodeManager.address
      );
      expect(await addressProvider.getDegenopolyPlayBoard()).equal(
        degenopolyPlayBoard.address
      );
    });
    it('play board', async function () {
      expect(await degenopolyPlayBoard.numberOfCases()).equal(24);
      console.log(
        'playboard cases: ',
        await degenopolyPlayBoard.getPlayboardCases()
      );
    });
    it('node manager', async function () {
      expect((await degenopolyNodeManager.getAllNodes()).length).equal(17);
      expect((await degenopolyNodeManager.getAllNodeFamilies()).length).equal(
        7
      );
      console.log('nodes: ', await degenopolyNodeManager.getAllNodes());
      console.log(
        'families: ',
        await degenopolyNodeManager.getAllNodeFamilies()
      );
    });
  });

  describe('#degenopoly', () => {
    const amount = ethers.utils.parseEther('100');
    const transferAmount = ethers.utils.parseEther('50');
    const sellTax = transferAmount.div(5); // 20%
    const ethTransferAmount = ethers.utils.parseEther('0.1');
    let degenopolyOut: BigNumber;
    let buyTax: BigNumber;
    let deadline: number;

    beforeEach(async function () {
      await degenopoly.mint(trader.address, amount);
      await degenopoly
        .connect(trader)
        .approve(uniswapv2Router.address, ethers.constants.MaxUint256);

      degenopolyOut = await uniswapv2Router.getAmountOut(
        ethTransferAmount,
        ethAmount,
        degenopolyAmount
      );
      buyTax = degenopolyOut.div(20); // 5%

      deadline = (await getTimeStamp()) + 3600;
    });

    it('sell', async function () {
      const tx = await uniswapv2Router
        .connect(trader)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          transferAmount,
          0,
          [degenopoly.address, weth.address],
          holder.address,
          deadline
        );
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(trader.address, degenopoly.address, sellTax);
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          trader.address,
          uniswapv2Pair.address,
          transferAmount.sub(sellTax)
        );

      expect(await degenopoly.balanceOf(trader.address)).equal(
        amount.sub(transferAmount)
      );
      expect(await degenopoly.balanceOf(degenopoly.address)).equal(sellTax);
      expect(await degenopoly.pendingTax()).equal(sellTax);
    });

    it('buy', async function () {
      const tx = await uniswapv2Router
        .connect(trader)
        .swapExactETHForTokensSupportingFeeOnTransferTokens(
          0,
          [weth.address, degenopoly.address],
          holder.address,
          deadline,
          { value: ethTransferAmount }
        );
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(uniswapv2Pair.address, degenopoly.address, buyTax);
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          uniswapv2Pair.address,
          holder.address,
          degenopolyOut.sub(buyTax)
        );

      expect(await degenopoly.balanceOf(holder.address)).equal(
        degenopolyOut.sub(buyTax)
      );
      expect(await degenopoly.balanceOf(degenopoly.address)).equal(buyTax);
      expect(await degenopoly.pendingTax()).equal(buyTax);
    });

    it('swap tax', async function () {
      const oldETHBalance = await ethers.provider.getBalance(deployer.address);
      const oldLPBalance = await uniswapv2Pair.balanceOf(deployer.address);

      await degenopoly.setSwapTaxSettings(true, sellTax);

      const tx = await uniswapv2Router
        .connect(trader)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          transferAmount,
          0,
          [degenopoly.address, weth.address],
          holder.address,
          deadline
        );
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(trader.address, degenopoly.address, sellTax);
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          trader.address,
          uniswapv2Pair.address,
          transferAmount.sub(sellTax)
        );
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          degenopoly.address,
          ethers.constants.AddressZero,
          sellTax.div(5)
        );
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          degenopoly.address,
          uniswapv2Pair.address,
          sellTax.mul(3).div(5)
        );

      expect(await degenopoly.balanceOf(trader.address)).equal(
        amount.sub(transferAmount)
      );
      expect(await degenopoly.balanceOf(degenopoly.address)).equal(
        ethers.constants.Zero
      );
      expect(await degenopoly.pendingTax()).equal(ethers.constants.Zero);

      console.log(
        'Tax ETH: ',
        (await ethers.provider.getBalance(deployer.address))
          .sub(oldETHBalance)
          .toString()
      );
      console.log(
        'Tax LP: ',
        (await uniswapv2Pair.balanceOf(deployer.address))
          .sub(oldLPBalance)
          .toString()
      );
    });
  });

  describe('#degenopoly node manager', () => {
    const amount = ethers.utils.parseEther('1000');
    let node: DegenopolyNode;
    let rewardPerSec: BigNumber;
    let price: BigNumber;
    let family: DegenopolyNodeFamily;
    let rewardBoost: BigNumber;

    beforeEach(async function () {
      await degenopoly.mint(trader.address, amount);
      await degenopoly
        .connect(trader)
        .approve(degenopolyNodeManager.address, ethers.constants.MaxUint256);
      await degenopolyNodes[0]
        .connect(trader)
        .setApprovalForAll(degenopolyNodeManager.address, true);
      await degenopolyNodes[1]
        .connect(trader)
        .setApprovalForAll(degenopolyNodeManager.address, true);

      node = degenopolyNodes[0];
      rewardPerSec = await node.rewardPerSec();
      price = await node.purchasePrice();
      family = degenopolyNodeFamilies[0];
      rewardBoost = await family.rewardBoost();
    });

    it('purchase node', async function () {
      const tx = await degenopolyNodeManager
        .connect(trader)
        .purchaseNode(node.address);
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(trader.address, deployer.address, price);

      expect(await node.balanceOf(trader.address)).equal(1);
      expect(
        await degenopolyNodeManager.getMultiplierFor(trader.address)
      ).equal(multiplier);
      expect(await degenopolyNodeManager.dailyRewardOf(trader.address)).equal(
        rewardPerSec.mul(86400)
      );
    });

    it('claimable rewards', async function () {
      await degenopolyNodeManager.connect(trader).purchaseNode(node.address);
      await increaseTime(86400); // 1 day

      let pending = await degenopolyNodeManager.claimableReward(trader.address);

      expect(pending).equal(rewardPerSec.mul(86400));
    });

    it('claim rewards', async function () {
      await degenopolyNodeManager.connect(trader).purchaseNode(node.address);
      const startBlock = await getLatestBlock();

      await increaseTime(86400); // 1 day

      let tx = await degenopolyNodeManager.connect(trader).claimReward();
      const endBlock = await getLatestBlock();
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero,
          trader.address,
          rewardPerSec.mul(
            parseInt(endBlock.timestamp) - parseInt(startBlock.timestamp)
          )
        );

      console.log(
        'pending reward after claim: ',
        (await degenopolyNodeManager.claimableReward(trader.address)).toString()
      );
    });

    it('purchase family', async function () {
      await degenopolyNodeManager.connect(trader).purchaseNode(node.address);
      await degenopolyNodeManager
        .connect(trader)
        .purchaseNode(degenopolyNodes[1].address);

      await degenopolyNodeManager
        .connect(trader)
        .purchaseNodeFamily(family.address, [0, 0]);

      expect(await node.balanceOf(trader.address)).equal(0);
      expect(await degenopolyNodes[1].balanceOf(trader.address)).equal(0);
      expect(await family.balanceOf(trader.address)).equal(1);
      expect(
        await degenopolyNodeManager.getMultiplierFor(trader.address)
      ).equal(rewardBoost);
      expect(await degenopolyNodeManager.dailyRewardOf(trader.address)).equal(
        ethers.constants.Zero
      );

      await degenopolyNodeManager.connect(trader).purchaseNode(node.address);
      expect(await degenopolyNodeManager.dailyRewardOf(trader.address)).equal(
        rewardPerSec.mul(86400).mul(rewardBoost).div(multiplier)
      );
    });
  });

  describe('#degenopoly play board', () => {
    const amount = ethers.utils.parseEther('10000');
    const fee = ethers.utils.parseEther('50');

    beforeEach(async function () {
      await degenopoly.mint(trader.address, amount);
      await degenopoly
        .connect(trader)
        .approve(degenopolyPlayBoard.address, ethers.constants.MaxUint256);
    });

    it('roll dice fee', async function () {
      const tx = await degenopolyPlayBoard.connect(trader).rollDice();
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(trader.address, deployer.address, fee.div(2));
      await expect(tx)
        .to.emit(degenopoly, 'Transfer')
        .withArgs(trader.address, degenopolyPlayBoard.address, fee.div(2));
    });

    it('roll dice', async function () {
      await degenopolyPlayBoard.connect(trader).rollDiceManually(1);
      await degenopolyPlayBoard.connect(trader).rollDiceManually(2);
      await degenopolyPlayBoard.connect(trader).rollDiceManually(3);
      await degenopolyPlayBoard.connect(trader).rollDiceManually(4);
      await degenopolyPlayBoard.connect(trader).rollDiceManually(5);
      await degenopolyPlayBoard.connect(trader).rollDiceManually(6);
    });
  });
});
