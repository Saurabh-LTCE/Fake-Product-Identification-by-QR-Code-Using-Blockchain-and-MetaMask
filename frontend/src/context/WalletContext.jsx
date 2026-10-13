import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  EXPECTED_CHAIN_ID,
  assertContractDeployed,
  friendlyError,
  getChainId,
  getExistingAccount,
  isAuthorizedManufacturer,
  isMetaMaskInstalled,
  requestAccounts,
  switchToHardhat,
} from "../services/blockchain";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const hasMetaMask = isMetaMaskInstalled();
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [authorized, setAuthorized] = useState(null); // null = unknown
  const [contractProblem, setContractProblem] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const accountRef = useRef(null);

  const refresh = useCallback(async (acct) => {
    if (!isMetaMaskInstalled()) return;
    try {
      const cid = await getChainId();
      setChainId(cid);
      if (!acct || cid !== EXPECTED_CHAIN_ID) {
        setAuthorized(null);
        setContractProblem("");
        return;
      }
      await assertContractDeployed();
      setAuthorized(await isAuthorizedManufacturer(acct));
      setContractProblem("");
    } catch (err) {
      setAuthorized(null);
      setContractProblem(friendlyError(err));
    }
  }, []);

  const applyAccount = useCallback(
    (acct) => {
      accountRef.current = acct;
      setAccount(acct);
      return refresh(acct);
    },
    [refresh]
  );

  useEffect(() => {
    if (!hasMetaMask) return undefined;
    getExistingAccount().then(applyAccount).catch(() => {});

    const onAccounts = (accounts) => applyAccount(accounts[0] || null);
    const onChain = () => refresh(accountRef.current);
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [hasMetaMask, applyAccount, refresh]);

  const connect = useCallback(async () => {
    setWalletError("");
    setConnecting(true);
    try {
      await applyAccount(await requestAccounts());
    } catch (err) {
      setWalletError(friendlyError(err));
    } finally {
      setConnecting(false);
    }
  }, [applyAccount]);

  const switchNetwork = useCallback(async () => {
    setWalletError("");
    try {
      await switchToHardhat();
      await refresh(accountRef.current);
    } catch (err) {
      setWalletError(friendlyError(err));
    }
  }, [refresh]);

  const correctNetwork = chainId === EXPECTED_CHAIN_ID;
  const ready = Boolean(account) && correctNetwork && authorized === true && !contractProblem;

  return (
    <WalletContext.Provider
      value={{ hasMetaMask, account, chainId, correctNetwork, authorized, contractProblem, connecting, walletError, ready, connect, switchNetwork }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
