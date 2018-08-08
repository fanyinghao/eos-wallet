/**
The template to display qrCode.

@class [template] views_modals_qrCode
@constructor
*/

Template['generateKey'].onRendered(function(){
    if(this.data && this.data.keys) {
        this.find('input[name="publicKey"]').value = this.data.keys.publicKeys.owner;
        this.find('input[name="privateKey"]').value = this.data.keys.privateKeys.owner;
    }
});
