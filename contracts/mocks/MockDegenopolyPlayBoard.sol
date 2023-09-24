// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import {DegenopolyPlayBoard} from '../game/DegenopolyPlayBoard.sol';

import {IAddressProvider} from '../interfaces/IAddressProvider.sol';
import {IDegenopoly} from '../interfaces/IDegenopoly.sol';
import {IDegenopolyNode} from '../interfaces/IDegenopolyNode.sol';
import {IDegenopolyNodeManager} from '../interfaces/IDegenopolyNodeManager.sol';

contract MockDegenopolyPlayBoard is DegenopolyPlayBoard {
    using SafeERC20 for IERC20;

    function setMintableNode(address _node) external {
        mintableNode[msg.sender] = _node;
    }

    function rollDiceManually(uint256 _dice) external {
        // fee to move forward
        IERC20 degenopoly = IERC20(addressProvider.getDegenopoly());
        uint256 devFee = (fee * devFeeRatio) / MULTIPLIER;
        uint256 treasuryFee = fee - devFee;

        degenopoly.safeTransferFrom(msg.sender, address(this), devFee);
        degenopoly.safeTransferFrom(
            msg.sender,
            addressProvider.getTreasury(),
            treasuryFee
        );

        // roll dice
        diceOf[msg.sender] = _dice;

        // position
        uint256 position = (positionOf[msg.sender] + _dice) % numberOfCases;
        positionOf[msg.sender] = position;

        // case
        Case memory nowCase = cases[position];

        // handle
        EventType eventType = _handleCase(msg.sender, nowCase);

        // event
        emit RollDice(msg.sender, _dice, position, nowCase, eventType);
    }
}
