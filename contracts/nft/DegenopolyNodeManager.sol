// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

import {IAddressProvider} from '../interfaces/IAddressProvider.sol';
import {IDegenopolyNodeManager} from '../interfaces/IDegenopolyNodeManager.sol';

contract DegenopolyNodeManager is OwnableUpgradeable, IDegenopolyNodeManager {
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice address provider
    IAddressProvider public addressProvider;

    /// @notice degenopoly nodes
    EnumerableSet.AddressSet private nodes;

    /* ======== ERRORS ======== */

    error ZERO_ADDRESS();

    /* ======== EVENTS ======== */

    event AddressProvider(address addressProvider);

    /* ======== INITIALIZATION ======== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _addressProvider,
        address[] calldata _nodes
    ) external initializer {
        // address provider
        if (_addressProvider == address(0)) revert ZERO_ADDRESS();
        addressProvider = IAddressProvider(_addressProvider);

        // degenopoly nodes
        uint256 length = _nodes.length;
        for (uint256 i = 0; i < length; i++) {
            address node = _nodes[i];
            if (node == address(0)) revert ZERO_ADDRESS();

            nodes.add(node);
        }

        // init
        __Ownable_init();
    }

    /* ======== POLICY FUNCTIONS ======== */

    function setAddressProvider(address _addressProvider) external onlyOwner {
        if (_addressProvider == address(0)) revert ZERO_ADDRESS();

        addressProvider = IAddressProvider(_addressProvider);

        emit AddressProvider(_addressProvider);
    }

    function addNodes(address[] calldata _nodes) external onlyOwner {
        uint256 length = _nodes.length;

        for (uint256 i = 0; i < length; i++) {
            address node = _nodes[i];
            if (node == address(0)) revert ZERO_ADDRESS();

            nodes.add(node);
        }
    }

    function removeNodes(address[] calldata _nodes) external onlyOwner {
        uint256 length = _nodes.length;

        for (uint256 i = 0; i < length; i++) {
            address node = _nodes[i];
            if (node == address(0)) revert ZERO_ADDRESS();

            nodes.remove(node);
        }
    }

    /* ======== VIEW FUNCTIONS ======== */

    function getAllNodes() external view returns (address[] memory) {
        return nodes.values();
    }

    function balanceOf(
        address _account
    ) external view returns (uint256 balance) {
        uint256 length = nodes.length();

        for (uint256 i = 0; i < length; i++) {
            balance += IERC721(nodes.at(i)).balanceOf(_account);
        }

        return balance;
    }
}
