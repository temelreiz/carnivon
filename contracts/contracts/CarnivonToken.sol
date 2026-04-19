// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ICompliance} from "./ICompliance.sol";

/// @title CarnivonToken (ERC-3643-style)
/// @notice Permissioned token representing a right to net proceeds from a
///         single Carnivon cycle SPV. One cycle = one token series.
///         1 token = $1 of participation (decimals fixed to 0 on purpose
///         — dollar-granular accounting).
///
/// @dev    This is a simplified ERC-3643-style implementation. A production
///         deployment should use the full T-REX suite from TokenySolutions
///         after a legal review of jurisdiction-specific compliance needs.
contract CarnivonToken is ERC20, AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");

    ICompliance public compliance;

    // Metadata — mirrors landing page / SPV docs
    string public spvEntity;
    string public operatorName;
    uint256 public startDate;
    uint256 public maturityDate;
    string public targetReturn;

    // Lifecycle
    enum CycleStatus { Funding, Active, Matured, Closed }
    CycleStatus public status;

    event ComplianceUpdated(address indexed compliance);
    event StatusChanged(CycleStatus status);
    event Frozen(address indexed wallet);
    event Unfrozen(address indexed wallet);
    event Redeemed(address indexed holder, uint256 amount);

    mapping(address => bool) public frozen;

    constructor(
        string memory name_,
        string memory symbol_,
        address admin,
        ICompliance compliance_,
        string memory spvEntity_,
        string memory operatorName_,
        uint256 startDate_,
        uint256 maturityDate_,
        string memory targetReturn_
    ) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(COMPLIANCE_ADMIN_ROLE, admin);
        compliance = compliance_;
        spvEntity = spvEntity_;
        operatorName = operatorName_;
        startDate = startDate_;
        maturityDate = maturityDate_;
        targetReturn = targetReturn_;
        status = CycleStatus.Funding;
    }

    /// @notice 0 decimals enforces $1 granular accounting.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    // ─── Admin ────────────────────────────────────────────────────────────

    function setCompliance(ICompliance c) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        compliance = c;
        emit ComplianceUpdated(address(c));
    }

    function setStatus(CycleStatus s) external onlyRole(OPERATOR_ROLE) {
        status = s;
        emit StatusChanged(s);
    }

    function pause() external onlyRole(OPERATOR_ROLE) { _pause(); }
    function unpause() external onlyRole(OPERATOR_ROLE) { _unpause(); }

    function freeze(address wallet) external onlyRole(OPERATOR_ROLE) {
        frozen[wallet] = true;
        emit Frozen(wallet);
    }

    function unfreeze(address wallet) external onlyRole(OPERATOR_ROLE) {
        frozen[wallet] = false;
        emit Unfrozen(wallet);
    }

    // ─── Mint / Redeem ────────────────────────────────────────────────────

    /// @notice Mint tokens to a subscribed investor. 1 token == $1 committed.
    function mint(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        require(status == CycleStatus.Funding, "not funding");
        _mint(to, amount);
    }

    /// @notice Mark tokens as redeemed at cycle close. Off-chain payout is
    ///         executed against a snapshot taken at maturity.
    function redeem(address from, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        require(status == CycleStatus.Matured || status == CycleStatus.Closed, "not matured");
        _burn(from, amount);
        emit Redeemed(from, amount);
    }

    // ─── Compliance hooks ─────────────────────────────────────────────────

    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        require(!frozen[from] && !frozen[to], "frozen");
        require(
            address(compliance) != address(0) && compliance.canTransfer(from, to, value),
            "compliance"
        );
        super._update(from, to, value);
        // Fire-and-forget bookkeeping hook (reverts are caught by transaction revert)
        compliance.transferred(from, to, value);
    }
}
