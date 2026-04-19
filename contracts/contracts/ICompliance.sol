// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICompliance
/// @notice ERC-3643-style compliance module. Token contract calls canTransfer
///         for every transfer; compliance can add jurisdiction/lockup rules.
interface ICompliance {
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool);

    /// @notice Hook called after a successful transfer for bookkeeping (e.g. holder count).
    function transferred(address from, address to, uint256 amount) external;
}
