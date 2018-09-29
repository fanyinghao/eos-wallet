/**
Template Controllers

@module Templates
*/

/**
The header template

@class [template] layout_header
@constructor
*/

Template["layout_header"].helpers({
  /**
    Returns the correct url for the send to route

    @method (goToSend)
    @return {String}
    */
  goToSend: function() {
    FlowRouter.watchPathChange();
    var name = FlowRouter.getParam("name");
    // For some reason the path /send/ doesn't show tokens anymore
    return name
      ? FlowRouter.path("sendFrom", { from: name })
      : FlowRouter.path("send");
  },
  /**
    Formats the last block number

    @method (formattedBlockNumber)
    @return {String}
    */
  formattedBlockNumber: function() {
    return EthBlocks.latest.number > 0
      ? numeral(EthBlocks.latest.number).format("0,0")
      : "--";
  },
  /**
    Gets the time since the last block

    @method (timeSinceBlock)
    */
  timeSinceBlock: function() {
    if (
      EthBlocks.latest.timestamp == 0 ||
      typeof EthBlocks.latest.timestamp == "undefined"
    )
      return false;

    var timeSince = moment(EthBlocks.latest.timestamp, "X");
    var now = moment();
    var diff = now.diff(timeSince, "seconds");

    if (diff > 60 * 5) {
      Helpers.rerun["10s"].tick();
      return '<span class="red">' + timeSince.fromNow(true) + "</span>";
    } else if (diff > 60) {
      Helpers.rerun["10s"].tick();
      return timeSince.fromNow(true);
    } else if (diff < 2) {
      Helpers.rerun["1s"].tick();
      return "";
    } else {
      Helpers.rerun["1s"].tick();
      return diff + "s ";
    }
  },
  /**
    Formats the time since the last block

    @method (timeSinceBlockText)
    */
  timeSinceBlockText: function() {
    if (
      EthBlocks.latest.timestamp == 0 ||
      typeof EthBlocks.latest.timestamp == "undefined"
    )
      return TAPi18n.__("wallet.app.texts.waitingForBlocks");

    var timeSince = moment(EthBlocks.latest.timestamp, "X");
    var now = moment();
    var diff = now.diff(timeSince, "seconds");

    if (diff > 60 * 5) {
      Helpers.rerun["10s"].tick();
      return (
        '<span class="red">' +
        TAPi18n.__("wallet.app.texts.timeSinceBlock") +
        "</span>"
      );
    } else if (diff > 60) {
      Helpers.rerun["10s"].tick();
      return TAPi18n.__("wallet.app.texts.timeSinceBlock");
    } else if (diff < 2) {
      Helpers.rerun["1s"].tick();
      return (
        '<span class="blue">' +
        TAPi18n.__("wallet.app.texts.blockReceived") +
        "</span>"
      );
    } else {
      Helpers.rerun["1s"].tick();
      return TAPi18n.__("wallet.app.texts.timeSinceBlock");
    }
  }
});
