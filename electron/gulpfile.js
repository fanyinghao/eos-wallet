/* eslint-disable
import/no-extraneous-dependencies,
strict,
prefer-spread
*/

const _ = require('./node_modules/underscore');
const gulp = require('./node_modules/gulp');
const minimist = require('./node_modules/minimist');
const runSeq = require('./node_modules/run-sequence');

// available crossplatform builds
let platforms;
if (process.platform === 'darwin') {
  platforms = ['mac', 'linux', 'win'];
} else if (process.platform === 'win32') {
  platforms = ['win'];
} else {
  platforms = ['linux', 'win'];
}

// parse commandline arguments
const args = process.argv.slice(2);
const options = minimist(args, {
  string: ['walletSource', 'test', 'skipTasks'],
  boolean: _.flatten(['wallet', platforms]),
  default: {
    wallet: false,
    walletSource: 'master',
    test: 'basic',
    skipTasks: ''
  }
});

// echo version info and usage hints
console.log('EOS Wallet version:', require('./package.json').version);
console.log(
  'Electron version:',
  require('./node_modules/electron/package.json').version
);

if (_.isEmpty(_.intersection(args, ['--wallet']))) {
  console.log('Many gulp tasks can be run in wallet mode using:  --wallet');
}

const platformFlags = platforms.map(platform => {
  return `--${platform}`;
});
if (_.isEmpty(_.intersection(args, platformFlags))) {
  console.log(
    `To specify a platform (default: all) use:  ${platformFlags.join(' ')}`
  );
  _.each(platforms, platform => {
    options[platform] = true;
  }); // activate all platform flags
}

// prepare global variables (shared with other gulp task files)
options.type = 'wallet';
options.platforms = platforms;
options.activePlatforms = _.keys(
  _.pick(_.pick(options, platforms), key => {
    return key;
  })
);

exports.options = options;

// import gulp tasks
require('./node_modules/require-dir')('./gulpTasks');

gulp.task('upload-queue', gulp.series('checksums', 'upload-binaries'));

const skipTasks = options.skipTasks.replace(/\s/g, '').split(',');
const tasks = [
  'clean-dist',
  'pack-wallet',
  'copy-app-source-files',
  'transpile-main',
  'transpile-modules',
  'copy-build-folder-files',
  'switch-production',
  'build-interface',
  'copy-interface',
  'move-wallet',
  'copy-i18n',
  'build-dist'
  // 'release-dist',
  // 'build-nsis',
  // 'verify-artifacts'
].filter(task => !skipTasks.includes(task));

gulp.task('default', gulp.series(tasks));
