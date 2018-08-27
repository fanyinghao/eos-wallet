import { SecureStorage } from "../../lib/eosjs-SecureStorage/lib";

const STORGE_ID = "EOS_ACCOUNT_";

export function SetKey(accountName, password, privateKey, publicKey) {
  if (!publicKey) publicKey = ecc.privateToPublic(privateKey);
  // storage private key
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  storage.set(accountName, { publicKey, sensitive: { privateKey } }, password);
}

export function Get(accountName, password) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  return storage.get(accountName, password);
}

export function Remove(accountName) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  return storage.remove(accountName);
}

export function SignProvider(accountName, password) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  let sensitive = storage.get(accountName, password).sensitive;
  if(!sensitive) 
    throw new Error('wrong password');
  let provider = ({sign, buf}) => sign(buf, sensitive.privateKey);
  return provider;
}

export function KeyProvider(accountName, password) {
    const storage = new SecureStorage({ id: STORGE_ID + chainId });
    let wif = storage.get(accountName, password).sensitive.privateKey;
    return [wif];
}
