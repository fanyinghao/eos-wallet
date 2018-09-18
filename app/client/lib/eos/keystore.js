import { SecureStorage } from "../../lib/eosjs-SecureStorage/lib";

const STORGE_ID = "EOS_ACCOUNT_";

export function SetKey(accountName, password, privateKey, publicKey) {
  if (!publicKey) {
    publicKey.active = ecc.privateToPublic(privateKey.active);
    publicKey.owner = ecc.privateToPublic(privateKey.owner);
  }
  // storage private key
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  storage.set(
    accountName,
    { publicKey: publicKey, sensitive: { privateKey: privateKey } },
    password
  );
}

export function UpdateKey(accountName, data) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  let item = storage.get(accountName);

  if (data.sensitive) delete data.sensitive;
  if (data.encryptedData) delete data.encryptedData;

  item = Object.assign(item, data);
  storage.set(accountName, item);
}

export function SetAccount(accountName) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  storage.set(accountName, { accountName });
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
  if (!sensitive) throw new Error("wrong password");
  let provider = ({ sign, buf }) => sign(buf, sensitive.privateKey);
  return provider;
}

export function KeyProvider(accountName, password) {
  const storage = new SecureStorage({ id: STORGE_ID + chainId });
  let wif = storage.get(accountName, password).sensitive.privateKey;
  return [wif];
}
