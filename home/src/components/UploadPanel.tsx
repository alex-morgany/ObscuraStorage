import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_DEPLOYED } from '../config/contracts';
import { mockIpfsUpload, humanReadableSize } from '../lib/ipfs';
import { decryptHashWithKey, encryptHashWithKey, generateSecretKey } from '../lib/encryption';
import type { ZamaHookState } from '../types/storage';
import '../styles/UploadPanel.css';

type UploadPanelProps = {
  zama: ZamaHookState;
  onStored: () => void;
};

export function UploadPanel({ zama, onStored }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const contractReady = CONTRACT_DEPLOYED;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [encryptedHash, setEncryptedHash] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setIpfsHash('');
    setSecretKey('');
    setEncryptedHash('');
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetState();
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    setIpfsHash('');
    setSecretKey('');
    setEncryptedHash('');
    setStatusMessage('');
  };

  const handleMockUpload = async () => {
    if (!selectedFile) {
      setStatusMessage('Please choose a file before uploading.');
      return;
    }

    setIsUploading(true);
    setStatusMessage('Simulating IPFS upload...');
    try {
      const hash = await mockIpfsUpload();
      const freshKey = generateSecretKey();
      const encrypted = encryptHashWithKey(hash, freshKey);
      setIpfsHash(hash);
      setSecretKey(freshKey);
      setEncryptedHash(encrypted);
      setStatusMessage('File prepared successfully. Secret key generated locally.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Unable to mock IPFS upload. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStoreOnchain = async () => {
    if (!contractReady) {
      setStatusMessage('Please deploy ObscuraStorage on Sepolia and update CONTRACT_ADDRESS.');
      return;
    }

    if (!selectedFile || !address || !secretKey || !encryptedHash || !signerPromise || !zama.instance) {
      setStatusMessage('Missing prerequisites. Connect wallet, upload the file, and wait for Zama.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('Encrypting secret key with Zama...');

    try {
      const encryptedInput = await zama.instance
        .createEncryptedInput(CONTRACT_ADDRESS, address)
        .add64(BigInt(secretKey))
        .encrypt();

      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Wallet signer is unavailable.');
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setStatusMessage('Sending transaction to store metadata...');
      const tx = await contract.storeFile(selectedFile.name, encryptedHash, encryptedInput.handles[0], encryptedInput.inputProof);
      await tx.wait();

      setStatusMessage('Encrypted file stored successfully!');
      onStored();
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : 'Failed to store encrypted file.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Upload & Encrypt</h2>
        <p className="panel-subtitle">Local encryption ensures no plaintext hashes or keys ever touch the blockchain.</p>
        {!contractReady && <p className="panel-warning">⚠️ Contract address not configured for this build.</p>}
      </div>

      <div className="panel-body">
        <div className="input-group">
          <label className="input-label">Choose a file</label>
          <input ref={fileInputRef} type="file" accept="*" onChange={handleFileChange} className="file-input" />
          {selectedFile ? (
            <p className="file-meta">
              {selectedFile.name} • {humanReadableSize(selectedFile)}
            </p>
          ) : (
            <p className="input-help">Documents, PDFs, and media files are supported.</p>
          )}
        </div>

        {previewUrl && (
          <div className="preview-box">
            <img src={previewUrl} alt="Selected file preview" />
          </div>
        )}

        <div className="action-row">
          <button type="button" className="action-button" disabled={!selectedFile || isUploading} onClick={handleMockUpload}>
            {isUploading ? 'Uploading...' : 'Upload to IPFS (mock)'}
          </button>
          <button
            type="button"
            className="action-button primary"
            disabled={!ipfsHash || !secretKey || isSaving || zama.isLoading || !contractReady}
            onClick={handleStoreOnchain}
          >
            {isSaving ? 'Saving...' : 'Save to ObscuraStorage'}
          </button>
        </div>

        {statusMessage && <p className="status-message">{statusMessage}</p>}

        {ipfsHash && (
          <div className="summary-grid">
            <div>
              <p className="summary-label">Mock IPFS hash</p>
              <p className="summary-value">{ipfsHash}</p>
            </div>
            <div>
              <p className="summary-label">Encrypted hash payload</p>
              <p className="summary-value truncate">{encryptedHash}</p>
            </div>
            <div>
              <p className="summary-label">Secret key (store safely)</p>
              <p className="summary-value secret">{secretKey}</p>
            </div>
            <div>
              <p className="summary-label">Decryption preview</p>
              <p className="summary-value">{secretKey ? decryptHashWithKey(encryptedHash, secretKey) : '—'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
