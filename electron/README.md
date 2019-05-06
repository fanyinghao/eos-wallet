# 编译打包 EOS Wallet

#### Generate packages

1.  Build static files:

```bash
eos-wallet> $ cd ../app/
eos-wallet/app> $ npm i && npm run build
```

2.  Pull lastest code:

```bash
eos-wallet/app> $ cd ../electron/ && yarn
```

3.  To generate the EOS Wallet:

```bash
eos-wallet/electron> $ yarn build:wallet
```

The generated binaries will be under `electron/dist_wallet/release`.

Note:

If you want build windows installer, you need `makensis` tool:

build on Mac

```bash
$ brew install makensis
```

#### Options

##### platform

To build binaries for specific platforms (default: all available) use the following flags:

```bash
$ yarn build:wallet --mac      # mac
$ yarn build:wallet --linux    # linux
$ yarn build:wallet --win      # windows
```

### Deployment

Our build system relies on [gulp](http://gulpjs.com/) and [electron-builder](https://github.com/electron-userland/electron-builder/).

#### Dependencies

Cross-platform builds require [additional dependencies](https://www.electron.build/multi-platform-build) needed by Electron Builder. Please follow their instructions for up to date dependency information.
