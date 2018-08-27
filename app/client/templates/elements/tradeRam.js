Template.tradeRam.onRendered(function() {
  template.$('input[name="to"]').focus();
});

Template.tradeRam.events({
  'keyup .amount input': function(e) {
    let amount = e.currentTarget.value.replace(/[a-zA-Z]+/g, '');
    if (amount.indexOf('.') == 0) amount = '0' + amount;
    if (amount.indexOf('.') >= 0)
      amount = amount.substring(0, amount.indexOf('.') + 5);
    if (
      amount[amount.length - 1] === '.' &&
      amount.indexOf('.') !== amount.length - 1
    )
      amount = amount.substring(0, amount.length - 1);
    e.currentTarget.value = amount;
    TemplateVar.set(e.target.name, amount.replace(',', '') || '0');
  },
  'keyup .bytes input': function(e) {
    let amount = e.currentTarget.value
      .replace(/[a-zA-Z]+/g, '')
      .replace('.', '');
    e.currentTarget.value = amount;
    TemplateVar.set(e.target.name, amount.replace(',', '') || 0);
  },
  'keyup input[name=to].to': function(e) {
    TemplateVar.set('to', e.target.value);
  },
  'click button': function(e, template) {
    let from = this.from;
    let to = TemplateVar.get('to');
    let buy_ram = TemplateVar.get('buy_ram');
    let sell_bytes = TemplateVar.get('sell_bytes');

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

      TemplateVar.set(template, 'sending', false);

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
      TemplateVar.set(template, 'sending', false);

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

    function buy_ram_tx(privateKey) {
      // show loading
      let _eos = get_eos(privateKey);

      try {
        _eos
          .transaction(tr => {
            tr.buyram(
              {
                payer: from,
                receiver: to,
                quant: toAmount(buy_ram)
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

    function sell_ram_tx(privateKey) {
      // show loading
      let _eos = get_eos(privateKey);

      try {
        _eos
          .transaction(tr => {
            tr.sellram(
              {
                account: from,
                bytes: parseInt(sell_bytes) * 1024
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

    if (!TemplateVar.get('sending')) {
      TemplateVar.set('sending', true);

      EthElements.Modal.show({
        template: 'authorized',
        data: {
          title: new Spacebars.SafeString(
            TAPi18n.__('wallet.send.tradeRam.authtitle', { name: from })
          ),
          account_name: from,
          callback: privateKey => {
            if (!TemplateVar.get('sending')) {
              if (e.target.name === 'buy_ram') {
                buy_ram_tx(privateKey);
              } else if (e.target.name === 'sell_ram') {
                sell_ram_tx(privateKey);
              }
            }
          }
        }
      });
    }
  }
});
