// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IIdentityRegistry
/// @notice Minimal ERC-3643-style identity registry. Maps wallets to verified
///         investor status with jurisdiction + investor-type metadata.
interface IIdentityRegistry {
    struct Identity {
        bool verified;
        uint16 countryCode; // ISO-3166 numeric, e.g. 840 = US, 76 = BR
        uint8 investorClass; // 1=retail, 2=accredited, 3=institutional
        uint64 verifiedAt;
        uint64 expiresAt;
    }

    event IdentityRegistered(address indexed wallet, uint16 countryCode, uint8 investorClass);
    event IdentityRevoked(address indexed wallet);

    function isVerified(address wallet) external view returns (bool);
    function identityOf(address wallet) external view returns (Identity memory);
    function registerIdentity(
        address wallet,
        uint16 countryCode,
        uint8 investorClass,
        uint64 expiresAt
    ) external;
    function revokeIdentity(address wallet) external;
}
