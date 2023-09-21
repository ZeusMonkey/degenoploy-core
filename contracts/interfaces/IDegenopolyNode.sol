// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {IERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

interface IDegenopolyNode is IERC721Upgradeable {
    function color() external view returns (string memory);

    function purhcasePrice() external view returns (uint256);

    function mint(address to) external;

    function syncReward(address _account) external;

    function claimReward(address _account) external returns (uint256 pending);

    function claimableReward(
        address _account
    ) external view returns (uint256 pending);
}
