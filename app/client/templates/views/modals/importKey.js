/**
The template to display qrCode.

@class [template] views_modals_qrCode
@constructor
*/

Template['generateKey'].onRendered(function(){
    if(this.data && this.data.accountName) {
        var qrcodesvg = new Qrcodesvg("ethereum:" + this.data.address, 'qrcode', 150, {"ecclevel" : 1});
        qrcodesvg.draw({"method": "classic", "fill-colors":["#555","#555","#666"]}, {"stroke-width":1});
    }
});
