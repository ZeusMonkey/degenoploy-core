// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IDegenopolyNodeManager {
    function getRewardBoostFor(
        address _account,
        string memory _color
    ) external view returns (uint256 rewardBoost, uint256 multiplier);

    function balanceOf(
        address _account
    ) external view returns (uint256 balance);

    function syncNodeReward(address _account) external;
}
