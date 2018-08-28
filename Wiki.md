# 帮助文档

EOS Wallet为一个可同时管理多个eos账户的工具，具有安全、简单等特点。

[Mac端下载](https://www.teambition.com/project/5a9f8ee678879274e20f6fce/works/5b83fc9a7739db0018e634cc/work/5b840127c509bc0018d5f359)



## 账户

第一次启动应用时钱包里还没有账户，可以进行创建或者导入。

* 创建：钱包为你自动创建账户需要的私钥（[owner、active使用相同的私钥](https://developers.eos.io/eosio*nodeos/docs/accounts*and*permissions)），此时你需定义账户名并创建密码。牢记钱包密码，并备份好私钥。

* 导入：你可以用你已有的账户私钥进行导入，同样需要创建密码并牢记。

### 新账户

新创建的账户还需要用另一个已有的账户进行协助，即用已有的账户做一笔创建账户事务，在[发送]下的[创建账户]进行。

### 账户管理

一个完整的账户，可以进行一系列的账户查阅和事务操作。

* 查看账户资源

* 买卖RAM资源

* 抵押赎回CPU/NET资源

* 账户多签授权

* 备份私钥

* 从钱包中删除账户

## 发送事务

* 转账（包括多签提案）

* 提案签名

* 创建账户

## 安全性
保存到钱包里的私钥使用[Stanford Javascript Crypto Library](https://github.com/bitwiseshiftleft/sjcl)的[AES-GCM库](https://github.com/nsjames/AES-OOP)对称加密算法