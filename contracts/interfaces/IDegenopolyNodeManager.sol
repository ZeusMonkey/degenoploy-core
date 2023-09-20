// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IDegenopolyNodeManager {
    function balanceOf(
        address _account
    ) external view returns (uint256 balance);
}
