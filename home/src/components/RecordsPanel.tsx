import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_DEPLOYED } from '../config/contracts';
import { decryptHashWithKey } from '../lib/encryption';
import type { DecryptedRecord, StoredFileRecord, ZamaHookState } from '../types/storage';
import '../styles/RecordsPanel.css';

type RecordsPanelProps = {
  refreshNonce: number;
  zama: ZamaHookState;
};

function formatTimestamp(value: bigint) {
  if (value === 0n) return '—';
  const millis = Number(value) * 1000;
  return new Date(millis).toLocaleString();
}

export function RecordsPanel({ refreshNonce, zama }: RecordsPanelProps) {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<Record<number, DecryptedRecord>>({});
  const [localError, setLocalError] = useState<string>('');

  const contractReady = CONTRACT_DEPLOYED;

  const { data, isFetching, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecords',
    args: address && contractReady ? [address] : undefined,
    query: {
      enabled: Boolean(address) && contractReady,
    },
  });

  useEffect(() => {
    if (address && contractReady) {
      refetch();
    }
  }, [address, refreshNonce, refetch, contractReady]);

  const records = useMemo<StoredFileRecord[]>(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return (data as any[]).map((record, index) => {
      const timestampValue = typeof record.timestamp === 'bigint' ? record.timestamp : BigInt(record.timestamp ?? 0);
      return {
        index,
        fileName: record.fileName as string,
        encryptedHash: record.encryptedHash as string,
        encryptedKey: record.encryptedKey as string,
        timestamp: timestampValue,
      };
    });
  }, [data]);

  const handleDecrypt = async (record: StoredFileRecord) => {
    if (!zama.instance || !address) {
      setLocalError('Zama SDK or wallet address missing.');
      return;
    }

    const walletSigner = await signer;
    if (!walletSigner) {
      setLocalError('Connect a wallet to decrypt.');
      return;
    }

    try {
      setLocalError('');
      setDecryptingIndex(record.index);

      const keypair = zama.instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const handles = [
        {
          handle: record.encryptedKey,
          contractAddress: CONTRACT_ADDRESS,
        },
      ];

      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const eip712 = zama.instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);

      const signature = await walletSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await zama.instance.userDecrypt(
        handles,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      const decryptedKey = `${result[record.encryptedKey] ?? ''}`;
      if (!decryptedKey) {
        throw new Error('Unable to decrypt the symmetric key.');
      }

      const hash = decryptHashWithKey(record.encryptedHash, decryptedKey);
      setDecrypted((prev) => ({
        ...prev,
        [record.index]: { secretKey: decryptedKey, ipfsHash: hash },
      }));
    } catch (error) {
      console.error(error);
      setLocalError(error instanceof Error ? error.message : 'Failed to decrypt the record.');
    } finally {
      setDecryptingIndex(null);
    }
  };

  if (!contractReady) {
    return (
      <section className="panel">
        <p>Please deploy ObscuraStorage on Sepolia and update the configured contract address.</p>
      </section>
    );
  }

  if (!address) {
    return (
      <section className="panel">
        <p>Please connect your wallet to view encrypted files.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">My Files</h2>
        <p className="panel-subtitle">Each entry stores the encrypted hash, timestamp, and its FHE protected key.</p>
      </div>

      {localError && <p className="records-error">⚠️ {localError}</p>}

      {isFetching && <p className="records-hint">Loading encrypted records...</p>}
      {!isFetching && records.length === 0 && <p className="records-hint">No encrypted files yet.</p>}

      <div className="records-grid">
        {records.map((record) => {
          const decryptedRecord = decrypted[record.index];
          return (
            <article key={`${record.encryptedKey}-${record.index}`} className="record-card">
              <div className="record-header">
                <div>
                  <p className="record-title">{record.fileName}</p>
                  <p className="record-meta">Stored {formatTimestamp(record.timestamp)}</p>
                </div>
                <button
                  type="button"
                  className="record-decrypt"
                  disabled={zama.isLoading || decryptingIndex === record.index}
                  onClick={() => handleDecrypt(record)}
                >
                  {decryptingIndex === record.index ? 'Decrypting...' : 'Decrypt'}
                </button>
              </div>

              <div className="record-row">
                <p className="record-label">Encrypted hash</p>
                <p className="record-value">{record.encryptedHash}</p>
              </div>

              <div className="record-row">
                <p className="record-label">Key handle</p>
                <p className="record-value">{record.encryptedKey}</p>
              </div>

              {decryptedRecord ? (
                <div className="decrypted-box">
                  <p className="record-label">Decrypted secret key</p>
                  <p className="record-secret">{decryptedRecord.secretKey}</p>
                  <p className="record-label">Original IPFS hash</p>
                  <p className="record-value">{decryptedRecord.ipfsHash}</p>
                </div>
              ) : (
                <p className="record-hint">Decrypt to reveal the original IPFS hash and symmetric key.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
