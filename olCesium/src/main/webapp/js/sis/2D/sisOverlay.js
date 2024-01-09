(function (window, $) {
    window.SisOverlay = function(selector, positioning, offset, className) {
        positioning = positioning ? positioning : "bottom-center";
        offset = offset ? offset : [0, 0];
        className = className ? className : "";

        this.overlay = null;

        if(selector) {
            this.overlay = new ol.Overlay({
                id: selector,
                element: document.querySelector(selector),
                offset: offset,
                positioning: positioning,
                className: 'sisOverlay' + className,
            });
        }

        return this.overlay;
    }
})(window, jQuery);