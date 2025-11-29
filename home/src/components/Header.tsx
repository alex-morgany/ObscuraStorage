import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div>
          <p className="header-eyebrow">Zama FHE • Encrypted Storage</p>
          <h1 className="header-title">Obscura Storage</h1>
          <p className="header-description">
            Upload any file, encrypt its IPFS reference locally with a secret key, and safeguard the key using Zama FHE.
          </p>
        </div>
        <ConnectButton showBalance={false} />
      </div>
    </header>
  );
}
