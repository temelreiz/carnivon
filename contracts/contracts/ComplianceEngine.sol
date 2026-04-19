// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IIdentityRegistry} from "./IIdentityRegistry.sol";
import {ICompliance} from "./ICompliance.sol";

/// @title ComplianceEngine
/// @notice Enforces transfer rules for a Carnivon cycle token:
///         - Both parties must be verified identities
///         - Sender jurisdiction not on blocklist
///         - Transfers locked until maturity (optional)
contract ComplianceEngine is ICompliance, AccessControl {
    bytes32 public constant TOKEN_ROLE = keccak256("TOKEN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IIdentityRegistry public immutable identity;

    uint64 public transferUnlockAt; // 0 = never auto-unlocks, set at maturity
    mapping(uint16 => bool) public jurisdictionBlocked;

    event UnlockSet(uint64 timestamp);
    event JurisdictionBlocked(uint16 countryCode, bool blocked);

    constructor(address admin, IIdentityRegistry _identity) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        identity = _identity;
    }

    function setTransferUnlock(uint64 ts) external onlyRole(OPERATOR_ROLE) {
        transferUnlockAt = ts;
        emit UnlockSet(ts);
    }

    function setJurisdictionBlocked(uint16 code, bool blocked) external onlyRole(OPERATOR_ROLE) {
        jurisdictionBlocked[code] = blocked;
        emit JurisdictionBlocked(code, blocked);
    }

    function grantTokenRole(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TOKEN_ROLE, token);
    }

    function canTransfer(
        address from,
        address to,
        uint256 /*amount*/
    ) external view override returns (bool) {
        // Mint: from=0 only needs `to` to be verified
        if (from == address(0)) {
            return _isAllowedHolder(to);
        }
        // Burn/redeem: from must be a verified holder, to=0 allowed
        if (to == address(0)) {
            return identity.isVerified(from);
        }
        // Peer transfer: check lockup and both sides
        if (transferUnlockAt == 0 || block.timestamp < transferUnlockAt) {
            return false;
        }
        return _isAllowedHolder(from) && _isAllowedHolder(to);
    }

    function transferred(address, address, uint256) external view override onlyRole(TOKEN_ROLE) {
        // hook-only; extend if holder count / caps are tracked
    }

    function _isAllowedHolder(address wallet) internal view returns (bool) {
        IIdentityRegistry.Identity memory i = identity.identityOf(wallet);
        if (!i.verified) return false;
        if (i.expiresAt != 0 && block.timestamp > i.expiresAt) return false;
        if (jurisdictionBlocked[i.countryCode]) return false;
        return true;
    }
}
