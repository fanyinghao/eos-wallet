const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

Template.views_account.onRendered(function() {
  let self = this
  let name = FlowRouter.getParam('name')
  TemplateVar.set(self, 'account_name', name)
  eos.getAccount(name).then(account => {
    account.creating = false;
    let item = keystore.Get(name)
    account.publicKey = item.publicKey;
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

Template['views_account'].onRendered(function() {
  console.timeEnd('renderAccountPage');
});

Template['views_account'].onDestroyed(function() {
  // stop watching custom events, on destroy
  if (this.customEventSubscription) {
    this.customEventSubscription.unsubscribe();
    this.customEventSubscription = null;
    TemplateVar.set('watchEvents', false);
  }
});

Template['views_account'].helpers({
  /**
    Get the current selected account

    @method (account)
    */
  account: function() {
    return TemplateVar.get('account');
  },
  /**
    Get the current jsonInterface, or use the wallet jsonInterface

    @method (jsonInterface)
    */
  jsonInterface: function() {
    return this.owners ? _.clone(walletInterface) : _.clone(this.jsonInterface);
  },
  /**
    Show requiredSignatures section

    @method (showRequiredSignatures)
    */
  showRequiredSignatures: function() {
    return this.requiredSignatures && this.requiredSignatures > 1;
  },
  /**
    Link the owner either to send or to the account itself.

    @method (ownerLink)
    */
  ownerLink: function() {
    var owner = String(this);
    if (Helpers.getAccountByAddress(owner))
      return FlowRouter.path('account', { address: owner });
    else return FlowRouter.path('sendTo', { address: owner });
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
  },
  /**
    Checks if this is Owned

    @method (ownedAccount)
    */
  ownedAccount: function() {
    return (
      EthAccounts.find({ address: this.address.toLowerCase() }).count() > 0
    );
  },
  /**
    Gets the contract events if available

    @method (customContract)
    */
  customContract: function() {
    return CustomContracts.findOne({ address: this.address.toLowerCase() });
  },
  /**
     Displays ENS names with triangles

     @method (nameDisplay)
     */
  displayName: function() {
    return this.ens
      ? this.name
          .split('.')
          .slice(0, -1)
          .reverse()
          .join(' ▸ ')
      : this.name;
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

    @event click button.delete
    */
  'click button.delete': function(e, template) {
    var data = this;

    EthElements.Modal.question({
      text: new Spacebars.SafeString(
        TAPi18n.__('wallet.accounts.modal.deleteText') +
          '<br><input type="text" class="deletionConfirmation" autofocus="true">'
      ),
      ok: function() {
        if ($('input.deletionConfirmation').val() === 'delete') {
          Wallets.remove(data._id);
          CustomContracts.remove(data._id);

          FlowRouter.go('dashboard');
          return true;
        }
      },
      cancel: true
    });
  },
  /**
    Click to copy the code to the clipboard

    @event click a.create.account
    */
  'click .copy-to-clipboard-button': accountClipboardEventHandler,

  /**
    Tries to copy account token.

    @event copy .copyable-address span
    */
  'copy .copyable-address': accountClipboardEventHandler,

  /**
    Click to export private Key

    @event click a.export private Key
    */
  'click .exportKey-button': function(e) {
    e.preventDefault();

    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'views_modals_qrCode',
      data: {
        address: this.address
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
  },

  /**
    Click to reveal the jsonInterface

    @event click .interface-button
    */
  'click .interface-button': function(e) {
    e.preventDefault();
    var jsonInterface = this.owners
      ? _.clone(walletInterface)
      : _.clone(this.jsonInterface);

    //clean ABI from circular references
    var cleanJsonInterface = _.map(jsonInterface, function(e, i) {
      return _.omit(e, 'contractInstance');
    });

    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: 'views_modals_interface',
      data: {
        jsonInterface: cleanJsonInterface
      }
    });
  },
  /**
    Click watch contract events

    @event change button.toggle-watch-events
    */
  'change .toggle-watch-events': function(e, template) {
    e.preventDefault();

    if (template.customEventSubscription) {
      template.customEventSubscription.unsubscribe();
      template.customEventSubscription = null;
      TemplateVar.set('watchEvents', false);
    } else {
      TemplateVar.set('watchEvents', true);
    }
  }
});
