export type StoredFileRecord = {
  index: number;
  fileName: string;
  encryptedHash: string;
  encryptedKey: string;
  timestamp: bigint;
};

export type DecryptedRecord = {
  secretKey: string;
  ipfsHash: string;
};

export type ZamaHookState = {
  instance: any;
  isLoading: boolean;
  error: string | null;
};
