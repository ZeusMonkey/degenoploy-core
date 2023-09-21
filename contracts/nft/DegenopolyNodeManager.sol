// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

import {IAddressProvider} from '../interfaces/IAddressProvider.sol';
import {IDegenopoly} from '../interfaces/IDegenopoly.sol';
import {IDegenopolyNode} from '../interfaces/IDegenopolyNode.sol';
import {IDegenopolyNodeManager} from '../interfaces/IDegenopolyNodeManager.sol';

contract DegenopolyNodeManager is OwnableUpgradeable, IDegenopolyNodeManager {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    /// @notice percent multiplier (100%)
    uint256 public constant MULTIPLIER = 10000;

    /// @notice address provider
    IAddressProvider public addressProvider;

    /// @dev mapping color => reward boost
    mapping(bytes32 => uint256) private rewardBoostOf;

    /// @notice degenopoly nodes
    EnumerableSet.AddressSet private nodes;

    /// @notice mapping color => degenopoly nodes
    mapping(bytes32 => EnumerableSet.AddressSet) private nodesOfColor;

    /* ======== ERRORS ======== */

    error ZERO_ADDRESS();
    error ZERO_AMOUNT();
    error INAVLID_NODE();
    error INVALID_LENGTH();

    /* ======== EVENTS ======== */

    event AddressProvider(address addressProvider);
    event Purchase(address account, address node);
    event ClaimReward(address account, uint256 reward);

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
            nodesOfColor[getColorBytes32(IDegenopolyNode(node).color())].add(
                node
            );
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
            nodesOfColor[getColorBytes32(IDegenopolyNode(node).color())].add(
                node
            );
        }
    }

    function removeNodes(address[] calldata _nodes) external onlyOwner {
        uint256 length = _nodes.length;

        for (uint256 i = 0; i < length; i++) {
            address node = _nodes[i];
            if (node == address(0)) revert ZERO_ADDRESS();

            nodes.remove(node);
            nodesOfColor[getColorBytes32(IDegenopolyNode(node).color())].remove(
                node
            );
        }
    }

    function setRewardBoost(
        string[] calldata _colors,
        uint256[] calldata _rewardBoosts
    ) external onlyOwner {
        uint256 length = _colors.length;
        if (length != _rewardBoosts.length) revert INVALID_LENGTH();

        for (uint256 i = 0; i < length; i++) {
            uint256 rewardBoost = _rewardBoosts[i];
            if (rewardBoost == 0) revert ZERO_AMOUNT();

            rewardBoostOf[getColorBytes32(_colors[i])] = rewardBoost;
        }
    }

    /* ======== NODE FUNCTIONS ======== */

    function syncNodeReward(address _account) external {
        if (!nodes.contains(msg.sender)) return;

        bytes32 color = getColorBytes32(IDegenopolyNode(msg.sender).color());
        uint256 length = nodesOfColor[color].length();

        for (uint256 i = 0; i < length; i++) {
            address node = nodesOfColor[color].at(i);

            if (node != msg.sender) {
                IDegenopolyNode(node).syncReward(_account);
            }
        }
    }

    /* ======== PUBLIC FUNCTIONS ======== */

    function purchase(address _node) external {
        if (!nodes.contains(_node)) revert INAVLID_NODE();

        // pay
        uint256 price = IDegenopolyNode(_node).purhcasePrice();
        IERC20(addressProvider.getDegenopoly()).safeTransferFrom(
            msg.sender,
            addressProvider.getTreasury(),
            price
        );

        // mint
        IDegenopolyNode(_node).mint(msg.sender);

        // event
        emit Purchase(msg.sender, _node);
    }

    function claimReward() external {
        uint256 reward;
        uint256 length = nodes.length();

        // total reward of nodes
        for (uint256 i = 0; i < length; i++) {
            reward += IDegenopolyNode(nodes.at(i)).claimReward(msg.sender);
        }

        // mint
        IDegenopoly(addressProvider.getDegenopoly()).mint(msg.sender, reward);

        // event
        emit ClaimReward(msg.sender, reward);
    }

    /* ======== VIEW FUNCTIONS ======== */

    function getAllNodes() external view returns (address[] memory) {
        return nodes.values();
    }

    function getNodesOfColor(
        string memory _color
    ) external view returns (address[] memory) {
        return nodesOfColor[getColorBytes32(_color)].values();
    }

    function getRewardBoostOf(
        string memory _color
    ) public view returns (uint256) {
        return rewardBoostOf[getColorBytes32(_color)];
    }

    function getRewardBoostFor(
        address _account,
        string memory _color
    ) external view returns (uint256 rewardBoost, uint256 multiplier) {
        multiplier = MULTIPLIER;

        bytes32 color = getColorBytes32(_color);
        uint256 length = nodesOfColor[color].length();

        for (uint256 i = 0; i < length; i++) {
            address node = nodesOfColor[color].at(i);

            if (IDegenopolyNode(node).balanceOf(_account) == 0) {
                rewardBoost = MULTIPLIER;
                break;
            }
        }

        rewardBoost = getRewardBoostOf(_color);
    }

    function balanceOf(
        address _account
    ) external view returns (uint256 balance) {
        uint256 length = nodes.length();

        for (uint256 i = 0; i < length; i++) {
            balance += IDegenopolyNode(nodes.at(i)).balanceOf(_account);
        }

        return balance;
    }

    function claimableReward(
        address _account
    ) external view returns (uint256 pending) {
        uint256 length = nodes.length();

        for (uint256 i = 0; i < length; i++) {
            pending += IDegenopolyNode(nodes.at(i)).claimableReward(_account);
        }

        return pending;
    }

    /* ======== INTERNAL FUNCTIONS ======== */

    function getColorBytes32(
        string memory _color
    ) internal pure returns (bytes32) {
        return keccak256(bytes(_color));
    }
}
