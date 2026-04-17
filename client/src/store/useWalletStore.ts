import { create } from "zustand";

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

interface WalletState {
  isMetaMaskInstalled: boolean;
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
}

function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  if (!provider || !provider.isMetaMask) return null;
  return provider;
}

let listenersAttached = false;

export const useWalletStore = create<WalletState>((set, get) => {
  const attachListeners = (provider: EthereumProvider) => {
    if (listenersAttached || !provider.on) return;

    provider.on("accountsChanged", (...args) => {
      const accounts = (args[0] as string[] | undefined) ?? [];
      set({ address: accounts[0] ?? null, error: null });
    });

    provider.on("chainChanged", (...args) => {
      const nextChainId = (args[0] as string | undefined) ?? null;
      set({ chainId: nextChainId });
    });

    listenersAttached = true;
  };

  return {
    isMetaMaskInstalled: false,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    initialize: async () => {
      const provider = getEthereumProvider();
      if (!provider) {
        set({
          isMetaMaskInstalled: false,
          address: null,
          chainId: null
        });
        return;
      }

      try {
        const [accountsResult, chainIdResult] = await Promise.all([
          provider.request({ method: "eth_accounts" }),
          provider.request({ method: "eth_chainId" })
        ]);

        const accounts = Array.isArray(accountsResult) ? (accountsResult as string[]) : [];
        const chainId = typeof chainIdResult === "string" ? chainIdResult : null;

        attachListeners(provider);
        set({
          isMetaMaskInstalled: true,
          address: accounts[0] ?? null,
          chainId,
          error: null
        });
      } catch {
        set({
          isMetaMaskInstalled: true,
          error: "Failed to read MetaMask state"
        });
      }
    },
    connect: async () => {
      const provider = getEthereumProvider();
      if (!provider) {
        set({
          isMetaMaskInstalled: false,
          error: "MetaMask is not installed"
        });
        return;
      }

      set({ isConnecting: true, error: null, isMetaMaskInstalled: true });

      try {
        const [accountsResult, chainIdResult] = await Promise.all([
          provider.request({ method: "eth_requestAccounts" }),
          provider.request({ method: "eth_chainId" })
        ]);

        const accounts = Array.isArray(accountsResult) ? (accountsResult as string[]) : [];
        const chainId = typeof chainIdResult === "string" ? chainIdResult : null;

        attachListeners(provider);
        set({
          address: accounts[0] ?? null,
          chainId,
          isConnecting: false,
          error: null
        });
      } catch {
        set({
          isConnecting: false,
          error: "MetaMask connection was rejected"
        });
      }
    }
  };
});

