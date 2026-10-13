// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ProductRegistry
/// @notice Stores a fingerprint (hash) of each product's data together with the
///         time it was registered. Only authorized manufacturer accounts can register.
///         Anyone can read the registry, which is how customers verify products.
/// @dev Detailed product data lives off-chain (MongoDB). Only the hash is on-chain,
///      so any later change to the off-chain data is detectable.
contract ProductRegistry {
    struct ProductRecord {
        bytes32 dataHash;
        uint256 registeredAt;
        address registeredBy;
        bool exists;
    }

    uint256 public constant MAX_PRODUCT_ID_LENGTH = 64;

    /// @notice The account that deployed the contract. It is always an authorized manufacturer.
    address public immutable owner;

    /// @notice Number of products registered so far.
    uint256 public totalProducts;

    mapping(address => bool) private authorizedManufacturers;
    mapping(bytes32 => ProductRecord) private records; // key = keccak256(productId)

    event ProductRegistered(
        string productId,
        bytes32 indexed dataHash,
        address indexed registeredBy,
        uint256 registeredAt
    );
    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerRevoked(address indexed manufacturer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can do this");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedManufacturers[msg.sender], "Caller is not an authorized manufacturer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedManufacturers[msg.sender] = true;
        emit ManufacturerAuthorized(msg.sender);
    }

    // ------------------------------------------------------------------
    // Manufacturer authorization
    // ------------------------------------------------------------------

    function authorizeManufacturer(address manufacturer) external onlyOwner {
        require(manufacturer != address(0), "Invalid address");
        authorizedManufacturers[manufacturer] = true;
        emit ManufacturerAuthorized(manufacturer);
    }

    function revokeManufacturer(address manufacturer) external onlyOwner {
        require(manufacturer != owner, "The owner cannot be revoked");
        authorizedManufacturers[manufacturer] = false;
        emit ManufacturerRevoked(manufacturer);
    }

    function isAuthorizedManufacturer(address account) external view returns (bool) {
        return authorizedManufacturers[account];
    }

    // ------------------------------------------------------------------
    // Registration
    // ------------------------------------------------------------------

    function registerProduct(string calldata productId, bytes32 dataHash) external onlyAuthorized {
        uint256 idLength = bytes(productId).length;
        require(idLength > 0 && idLength <= MAX_PRODUCT_ID_LENGTH, "Product ID must be 1-64 characters");
        require(dataHash != bytes32(0), "Data hash cannot be empty");

        bytes32 key = keccak256(bytes(productId));
        require(!records[key].exists, "Product ID already registered");

        records[key] = ProductRecord({
            dataHash: dataHash,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });
        totalProducts += 1;

        emit ProductRegistered(productId, dataHash, msg.sender, block.timestamp);
    }

    // ------------------------------------------------------------------
    // Public verification
    // ------------------------------------------------------------------

    function isProductRegistered(string calldata productId) external view returns (bool) {
        return records[keccak256(bytes(productId))].exists;
    }

    function getProduct(string calldata productId)
        external
        view
        returns (bool registered, bytes32 dataHash, uint256 registeredAt, address registeredBy)
    {
        ProductRecord storage r = records[keccak256(bytes(productId))];
        return (r.exists, r.dataHash, r.registeredAt, r.registeredBy);
    }

    function verifyProduct(string calldata productId, bytes32 expectedHash)
        external
        view
        returns (bool registered, bool hashMatches)
    {
        ProductRecord storage r = records[keccak256(bytes(productId))];
        return (r.exists, r.exists && r.dataHash == expectedHash);
    }
}
