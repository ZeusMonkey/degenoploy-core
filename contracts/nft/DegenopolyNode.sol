// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {ERC721PresetMinterPauserAutoIdUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol';

import {IAddressProvider} from '../interfaces/IAddressProvider.sol';
import {IDegenopolyNodeManager} from '../interfaces/IDegenopolyNodeManager.sol';

contract DegenopolyNode is ERC721PresetMinterPauserAutoIdUpgradeable {
    struct RewardInfo {
        uint256 pending;
        uint256 debt;
    }

    /// @notice color family
    string public color;

    /// @notice address provider
    IAddressProvider public addressProvider;

    /// @notice cap
    uint256 public cap;

    /// @notice degenopoly reward per second
    uint256 public rewardPerSec;

    /// @notice purchase price in degenopoly
    uint256 public purhcasePrice;

    /// @dev reward accTokenPerShare
    uint256 private accTokenPerShare;

    /// @dev reward lastUpdate
    uint256 private lastUpdate;

    /// @dev mapping account => reward info
    mapping(address => RewardInfo) private rewardInfoOf;

    /* ======== ERRORS ======== */

    error ZERO_ADDRESS();
    error NOT_MANAGER();
    error CAP_EXCEED();

    /* ======== EVENTS ======== */

    event AddressProvider(address addressProvider);

    /* ======== INITIALIZATION ======== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI,
        string memory _color,
        address _addressProvider,
        uint256 _rewardPerSec,
        uint256 _purhcasePrice
    ) external initializer {
        if (_addressProvider == address(0)) revert ZERO_ADDRESS();

        // color family
        color = _color;

        // set address provider
        addressProvider = IAddressProvider(_addressProvider);
        _setupRole(MINTER_ROLE, addressProvider.getDegenopolyNodeManager());

        // reward per second
        rewardPerSec = _rewardPerSec;

        // purhcase price
        purhcasePrice = _purhcasePrice;

        // cap on the token's total supply
        cap = 1000;

        // init
        __ERC721PresetMinterPauserAutoId_init(_name, _symbol, _baseTokenURI);
    }

    /* ======== MODIFIERS ======== */

    modifier onlyOwner() {
        _checkRole(DEFAULT_ADMIN_ROLE);
        _;
    }

    modifier onlyManager() {
        if (msg.sender != addressProvider.getDegenopolyNodeManager())
            revert NOT_MANAGER();
        _;
    }

    modifier update() {
        if (totalSupply() > 0) {
            accTokenPerShare +=
                (rewardPerSec * (block.timestamp - lastUpdate)) /
                totalSupply();
        }
        lastUpdate = block.timestamp;

        _;
    }

    /* ======== POLICY FUNCTIONS ======== */

    function setAddressProvider(address _addressProvider) external onlyOwner {
        if (_addressProvider == address(0)) revert ZERO_ADDRESS();

        addressProvider = IAddressProvider(_addressProvider);

        emit AddressProvider(_addressProvider);
    }

    /* ======== MANAGER FUNCTIONS ======== */

    function syncReward(address _account) external onlyManager update {
        RewardInfo storage rewardInfo = _updateReward(_account);
        rewardInfo.debt = accTokenPerShare * balanceOf(_account);
    }

    function claimReward(
        address _account
    ) external onlyManager update returns (uint256 pending) {
        RewardInfo storage rewardInfo = _updateReward(_account);
        rewardInfo.debt = accTokenPerShare * balanceOf(_account);

        pending = rewardInfo.pending;
        rewardInfo.pending = 0;
    }

    /* ======== VIEW FUNCTIONS ======== */

    function claimableReward(
        address _account
    ) external view returns (uint256 pending) {
        uint256 balance = balanceOf(_account);
        if (balance == 0) return 0;

        uint256 accTokenPerShare_ = accTokenPerShare +
            (rewardPerSec * (block.timestamp - lastUpdate)) /
            totalSupply();
        (uint256 rewardBoost, uint256 multiplier) = IDegenopolyNodeManager(
            addressProvider.getDegenopolyNodeManager()
        ).getRewardBoostFor(_account, color);
        RewardInfo storage rewardInfo = rewardInfoOf[_account];

        pending =
            rewardInfo.pending +
            ((accTokenPerShare_ * balance - rewardInfo.debt) * rewardBoost) /
            multiplier;
    }

    /* ======== INTERNAL FUNCTIONS ======== */

    function _mint(address to, uint256 tokenId) internal virtual override {
        if (totalSupply() >= cap) revert CAP_EXCEED();

        super._mint(to, tokenId);
    }

    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _firstTokenId,
        uint256 _batchSize
    ) internal virtual override update {
        super._beforeTokenTransfer(_from, _to, _firstTokenId, _batchSize);

        if (_from != address(0)) {
            RewardInfo storage rewardInfo = _updateReward(_from);
            rewardInfo.debt = accTokenPerShare * (balanceOf(_from) - 1);

            IDegenopolyNodeManager(addressProvider.getDegenopolyNodeManager())
                .syncNodeReward(_from);
        }

        if (_to != address(0)) {
            RewardInfo storage rewardInfo = _updateReward(_to);
            rewardInfo.debt = accTokenPerShare * (balanceOf(_to) + 1);

            IDegenopolyNodeManager(addressProvider.getDegenopolyNodeManager())
                .syncNodeReward(_to);
        }
    }

    function _updateReward(
        address _account
    ) internal returns (RewardInfo storage rewardInfo) {
        if (_account == address(0)) revert ZERO_ADDRESS();

        uint256 balance = balanceOf(_account);
        (uint256 rewardBoost, uint256 multiplier) = IDegenopolyNodeManager(
            addressProvider.getDegenopolyNodeManager()
        ).getRewardBoostFor(_account, color);

        rewardInfo = rewardInfoOf[_account];
        rewardInfo.pending =
            ((accTokenPerShare * balance - rewardInfo.debt) * rewardBoost) /
            multiplier;
    }
}
