import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Obscura Storage',
  projectId: '2a5f20ef7ad34d9d95b13f44be1bf96a',
  chains: [sepolia],
  ssr: false,
});
