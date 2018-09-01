const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

Template.views_account.onRendered(function() {
  let self = this

  Tracker.autorun(function() {

    let name = FlowRouter.getParam('name')
    if(!name)
      return;
    TemplateVar.set(self, 'account_name', name)
    eos.getAccount(name).then(account => {
      account.creating = false;
      TemplateVar.set(self, 'account', account)

      eos.getCurrencyBalance('eosio.token', name).then(res => {
          TemplateVar.set(self, 'balance', res);
        }, err => {
        console.log(err)
      })
    }, err => {
      FlowRouter.go('/notfound');
    })
  })
})

Template['views_account'].onRendered(function() {
});

Template['views_account'].helpers({
  /**
    Get the current selected account

    @method (account)
    */
  account: function() {
    return TemplateVar.get('account');
  },
  accountName: function() {
    let account = TemplateVar.get('account');
    return account.account_name;
  },
  /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
  formattedBalance: function(e) {
    var balance = TemplateVar.get('balance'); 
    if(!balance || balance.length === 0) 
      balance = ["0.0000 EOS"]
    return balance[0];
  },
  refundBalance: function(e) {
    let account = TemplateVar.get('account');
    if(!account.refund_request)
      return "0.0000 EOS";
    let total = 
    Number(account.refund_request.cpu_amount.replace('EOS', '').trim()) +
    Number(account.refund_request.net_amount.replace('EOS', '').trim())
    return total.toFixed(4) + ' EOS'
  },
  ramToString: function(e) {
    
    return (e / 1024).toFixed(3) + ' KB'
  },
  progress: function(e, v, a) {
    
    return (e/v *100).toFixed(a) + '%'
  }
});

var accountClipboardEventHandler = function(e) {
  if (Session.get('tmpAllowCopy') === true) {
    Session.set('tmpAllowCopy', false);
    return true;
  } else {
    e.preventDefault();
  }

  function copyAddress() {
    var copyTextarea = document.querySelector('.copyable-address span');
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(copyTextarea);
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      document.execCommand('copy');

      GlobalNotification.info({
        content: 'i18n:wallet.accounts.addressCopiedToClipboard',
        duration: 3
      });
    } catch (err) {
      GlobalNotification.error({
        content: 'i18n:wallet.accounts.addressNotCopiedToClipboard',
        closeable: false,
        duration: 3
      });
    }
    selection.removeAllRanges();
  }

  if (Helpers.isOnMainNetwork()) {
    Session.set('tmpAllowCopy', true);
    copyAddress();
  } else {
    EthElements.Modal.question({
      text: new Spacebars.SafeString(
        TAPi18n.__('wallet.accounts.modal.copyAddressWarning')
      ),
      ok: function() {
        Session.set('tmpAllowCopy', true);
        copyAddress();
      },
      cancel: true,
      modalQuestionOkButtonText: TAPi18n.__('wallet.accounts.modal.buttonOk'),
      modalQuestionCancelButtonText: TAPi18n.__(
        'wallet.accounts.modal.buttonCancel'
      )
    });
  }
};

Template['views_account'].events({
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
   'click button.buy-button': function(e, template) {

    let account_name = TemplateVar.get('account_name');
    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'tradeRam',
      data: {
        from: account_name,
        callback: () => {
          return true;
        }
      }
    },
    {
      class: "modal-small"
    });
  },
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
   'click button.stake-button': function(e, template) {

    let account_name = TemplateVar.get('account_name');
    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'stake',
      data: {
        from: account_name,
        callback: () => {
          return true;
        }
      }
    },
    {
      class: "modal-medium"
    });
  },
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
  'click button.remove-button': function(e, template) {

    let account_name = TemplateVar.get('account_name');
    EthElements.Modal.show({
      template: 'authorized',
      data: {
        title: new Spacebars.SafeString(
          TAPi18n.__('wallet.accounts.modal.deleteText')
        ),
        account_name: account_name,
        callback: (privateKey) => {
          keystore.Remove(account_name);
          FlowRouter.go('dashboard');
          return true;
        }
      }
    });
  },
  /**
    Click to export private Key

    @event click a.export private Key
    */
  'click button.exportKey-button': function(e) {
    e.preventDefault();
    let account_name = TemplateVar.get('account_name');
    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'authorized',
      data: {
        account_name: account_name,
        callback: (privateKey) => {
          EthElements.Modal.hide();
          EthElements.Modal.question({
            text: privateKey,
            ok: () => {}
          },
          {
            closeable: false,
            class: "modal-medium"
          })
        }
      }
    });
  },

  /**
    Authorize of the account

    @event click a.create.account
    */
   'click .authorize-button': function(e) {
    e.preventDefault();
    var owners = [];
    let account = this;
    account.permissions.forEach((item) => {
      if(item.perm_name === "active"){
        owners = Array.prototype.map.call(item.required_auth.accounts, function(obj) {
          return obj.permission.actor;
        });
        return;
      }
    })

    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'views_account_authorize',
      data: {
        account: this,
        owners: owners
      }
    },
    {
      class: 'modal-small'
    });
  }
});
