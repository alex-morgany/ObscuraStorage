import { useState } from 'react';
import { Header } from './Header';
import { UploadPanel } from './UploadPanel';
import { RecordsPanel } from './RecordsPanel';
import { useZamaInstance } from '../hooks/useZamaInstance';
import type { ZamaHookState } from '../type/storage';
import '../styles/StorageApp.css';

export function StorageApp() {
  const [activeTab, setActiveTab] = useState<'upload' | 'records'>('upload');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const zamaState = useZamaInstance() as ZamaHookState;

  const handleStored = () => {
    setRefreshNonce((prev) => prev + 1);
    setActiveTab('records');
  };

  return (
    <div className="storage-app">
      <Header />
      <main className="storage-main">
        <div className="tab-wrapper">
          <div className="tab-nav">
            <button
              className={`tab-button ${activeTab === 'upload' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('upload')}
              type="button"
            >
              Upload & Encrypt
            </button>
            <button
              className={`tab-button ${activeTab === 'records' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('records')}
              type="button"
            >
              My Files
            </button>
          </div>
          {zamaState.error ? (
            <p className="zama-error">⚠️ {zamaState.error}</p>
          ) : (
            <p className="zama-hint">
              {zamaState.isLoading ? 'Initializing Zama SDK...' : 'Zama relayer initialized successfully.'}
            </p>
          )}
        </div>

        {activeTab === 'upload' ? (
          <UploadPanel zama={zamaState} onStored={handleStored} />
        ) : (
          <RecordsPanel zama={zamaState} refreshNonce={refreshNonce} />
        )}
      </main>
    </div>
  );
}
