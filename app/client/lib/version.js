Version = new Meteor.Collection('version');

if (Version.find().count() > 0) {
  Version.remove({});
}
Version.insert(JSON.parse(Assets.getText('version.json')));
