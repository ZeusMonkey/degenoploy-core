// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IAddressProvider {
    function getTreasury() external view returns (address);

    function getDegenopoly() external view returns (address);

    function getDegenopolyNodeManager() external view returns (address);

    function getArbipolyPlayBoard() external view returns (address);
}
