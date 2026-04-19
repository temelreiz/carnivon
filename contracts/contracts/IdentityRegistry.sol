// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IIdentityRegistry} from "./IIdentityRegistry.sol";

/// @title IdentityRegistry
/// @notice Off-chain KYC'd identities are recorded on-chain by operators.
///         The token contract consults this registry to enforce transfer rules.
contract IdentityRegistry is IIdentityRegistry, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    mapping(address => Identity) private _ids;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    function isVerified(address wallet) external view override returns (bool) {
        Identity memory i = _ids[wallet];
        if (!i.verified) return false;
        if (i.expiresAt != 0 && block.timestamp > i.expiresAt) return false;
        return true;
    }

    function identityOf(address wallet) external view override returns (Identity memory) {
        return _ids[wallet];
    }

    function registerIdentity(
        address wallet,
        uint16 countryCode,
        uint8 investorClass,
        uint64 expiresAt
    ) external override onlyRole(OPERATOR_ROLE) {
        require(wallet != address(0), "wallet=0");
        require(investorClass >= 1 && investorClass <= 3, "class");
        _ids[wallet] = Identity({
            verified: true,
            countryCode: countryCode,
            investorClass: investorClass,
            verifiedAt: uint64(block.timestamp),
            expiresAt: expiresAt
        });
        emit IdentityRegistered(wallet, countryCode, investorClass);
    }

    function revokeIdentity(address wallet) external override onlyRole(OPERATOR_ROLE) {
        delete _ids[wallet];
        emit IdentityRevoked(wallet);
    }
}
