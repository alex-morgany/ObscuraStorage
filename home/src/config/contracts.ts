export const CONTRACT_ADDRESS = '0xb9E4461f76B94e97717bEaCE39A8D223Bd7201d9';
export const CONTRACT_DEPLOYED = true
export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'fileName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'encryptedHash',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'FileStored',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'fileName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'encryptedHash',
        type: 'string',
      },
      {
        internalType: 'externalEuint64',
        name: 'encryptedKeyHandle',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'proof',
        type: 'bytes',
      },
    ],
    name: 'storeFile',
    outputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'getRecordCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'getRecord',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'fileName',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'encryptedHash',
            type: 'string',
          },
          {
            internalType: 'euint64',
            name: 'encryptedKey',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
        ],
        internalType: 'struct ObscuraStorage.FileRecord',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'getRecords',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'fileName',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'encryptedHash',
            type: 'string',
          },
          {
            internalType: 'euint64',
            name: 'encryptedKey',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
        ],
        internalType: 'struct ObscuraStorage.FileRecord[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
