Template.stake.onRendered(function() {
  template.$('input[name="to"]').focus();
});

Template.stake.events({
  'keyup .amount input': function(e) {
    let amount = e.currentTarget.value.replace(/[a-zA-Z]+/g, '');
    if (amount.indexOf('.') == 0) amount = '0' + amount;
    if (amount.indexOf('.') >= 0)
      amount = amount.substring(0, amount.indexOf('.') + 5);
    if (amount[amount.length - 1] === '.' && amount.indexOf('.') !== amount.length -1)
        amount = amount.substring(0, amount.length -1);
    e.currentTarget.value = amount;
    TemplateVar.set(e.target.name, amount.replace(',', '') || '0');
  },
  'keyup input[name=to].to': function(e) {
    TemplateVar.set('to', e.target.value);
  },
  'click button': function(e) {
    let template = this;
    let from = this.from;
    let to = TemplateVar.get('to');
    let stake_cpu = TemplateVar.get('stake_cpu');
    let stake_net = TemplateVar.get('stake_net');
    let unstake_cpu = TemplateVar.get('unstake_cpu');
    let unstake_net = TemplateVar.get('unstake_net');

    function get_eos(privateKey) {
      const _eos = Eos({
        httpEndpoint: httpEndpoint,
        chainId: chainId,
        keyProvider: [privateKey],
        verbose: false
      });
      return _eos;
    }

    var onSuccess = tr => {
      console.log(tr);
      EthElements.Modal.hide();

      GlobalNotification.success({
        content: 'i18n:wallet.send.transactionSent',
        duration: 20,
        ok: function() {
          window.open(`${transactionMonitor}/${tr.transaction_id}`);
          return true;
        },
        okText: `#${tr.transaction_id.substr(0, 10)}..`
      });
    };

    var onError = err => {
      EthElements.Modal.hide();
      if (err.message) {
        GlobalNotification.error({
          content: err.message,
          duration: 20
        });
      } else {
        let error = JSON.parse(err);
        GlobalNotification.error({
          content: Helpers.translateExternalErrorMessage(error.error),
          duration: 20
        });
      }
      return;
    };

    function toAmount(value) {
      let amount =
        value > 0
          ? `${parseFloat(value).toFixed(4)} EOS`
          : `${parseFloat(0).toFixed(4)} EOS`;
      return amount;
    }

    function stake(privateKey) {
      // show loading
      let _eos = get_eos(privateKey);

      try {
        _eos
          .transaction(tr => {
            tr.delegatebw(
              {
                from: from,
                receiver: to,
                stake_net_quantity: toAmount(stake_net),
                stake_cpu_quantity: toAmount(stake_cpu),
                transfer: 0
              },
              {
                authorization: `${from}@active`
              }
            );
          })
          .then(onSuccess, onError);
      } catch (e) {
        handleError(e);
      }
    }

    function unstake(privateKey) {
      // show loading
      let _eos = get_eos(privateKey);

      try {
        _eos
          .transaction(tr => {
            tr.undelegatebw(
              {
                from: from,
                receiver: to,
                unstake_net_quantity: toAmount(unstake_net),
                unstake_cpu_quantity: toAmount(unstake_cpu),
                transfer: 0
              },
              {
                authorization: `${from}@active`
              }
            );
          })
          .then(onSuccess, onError);
      } catch (e) {
        handleError(e);
      }
    }

    EthElements.Modal.show({
      template: 'authorized',
      data: {
        title: new Spacebars.SafeString(
          TAPi18n.__('wallet.send.stake.authtitle', {name: from})
        ),
        account_name: from,
        callback: privateKey => {
          if (e.target.name === 'stake') {
            stake(privateKey);
          } else if (e.target.name === 'unstake') {
            unstake(privateKey);
          }
        }
      }
    });
  }
});
