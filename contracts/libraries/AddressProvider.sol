// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import {IAddressProvider} from '../interfaces/IAddressProvider.sol';

contract AddressProvider is OwnableUpgradeable, IAddressProvider {
    bytes32 private constant TREASURY = 'TREASURY';
    bytes32 private constant DEGENOPOLY = 'DEGENOPOLY';
    bytes32 private constant DEGENOPOLY_NODE_MANAGER =
        'DEGENOPOLY_NODE_MANAGER';
    bytes32 private constant ARBIPOLY_PLAY_BOARD = 'ARBIPOLY_PLAY_BOARD';

    /// @notice address storage
    mapping(bytes32 => address) private _addresses;

    /* ======== ERRORS ======== */

    error ZERO_ADDRESS();

    /* ======== INITIALIZATION ======== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        // init
        __Ownable_init();
    }

    /* ======== POLICY FUNCTIONS ======== */

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZERO_ADDRESS();

        _addresses[TREASURY] = _treasury;
    }

    function setDegenopoly(address _degenopoly) external onlyOwner {
        if (_degenopoly == address(0)) revert ZERO_ADDRESS();

        _addresses[DEGENOPOLY] = _degenopoly;
    }

    function setDegenopolyNodeManager(
        address _degenopolyNodeManager
    ) external onlyOwner {
        if (_degenopolyNodeManager == address(0)) revert ZERO_ADDRESS();

        _addresses[DEGENOPOLY_NODE_MANAGER] = _degenopolyNodeManager;
    }

    function setArbipolyPlayBoard(
        address _arbipolyPlayBoard
    ) external onlyOwner {
        if (_arbipolyPlayBoard == address(0)) revert ZERO_ADDRESS();

        _addresses[ARBIPOLY_PLAY_BOARD] = _arbipolyPlayBoard;
    }

    /* ======== VIEW FUNCTIONS ======== */

    function getTreasury() external view returns (address) {
        return _addresses[TREASURY];
    }

    function getDegenopoly() external view returns (address) {
        return _addresses[DEGENOPOLY];
    }

    function getDegenopolyNodeManager() external view returns (address) {
        return _addresses[DEGENOPOLY_NODE_MANAGER];
    }

    function getArbipolyPlayBoard() external view returns (address) {
        return _addresses[ARBIPOLY_PLAY_BOARD];
    }
}
