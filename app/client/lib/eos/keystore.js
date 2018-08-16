import { SecureStorage } from "../../lib/eosjs-SecureStorage/lib";

const STORGE_ID = "EOS_ACCOUNT";

export function SetKey(accountName, password, privateKey, publicKey) {
  if (!publicKey) publicKey = ecc.privateToPublic(privateKey);
  // storage private key
  const storage = new SecureStorage({ id: STORGE_ID });
  storage.set(accountName, { publicKey, sensitive: { privateKey } }, password);
}

export function Get(accountName, password) {
  const storage = new SecureStorage({ id: STORGE_ID });
  return storage.get(accountName, password);
}

export function SignProvider(accountName, password) {
  const storage = new SecureStorage({ id: STORGE_ID });
  let sensitive = storage.get(accountName, password).sensitive;
  if(!sensitive) 
    throw new Error('wrong password');
  let provider = ({sign, buf}) => sign(buf, sensitive.privateKey);
  return provider;
}

export function KeyProvider(accountName, password) {
    const storage = new SecureStorage({ id: STORGE_ID });
    let wif = storage.get(accountName, password).sensitive.privateKey;
    return [wif];
}
