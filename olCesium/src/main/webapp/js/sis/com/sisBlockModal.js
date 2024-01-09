(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        factory(require("jquery"), window, document);
    } else {
        factory(jQuery, window, document);
    }
}(function ($, window, document, undefined) {

    var sisModals = [],
        getCurrent = function () {
            return sisModals.length ? sisModals[sisModals.length - 1] : null;
        },
        selectCurrent = function () {
            var i,
                selected = false;
            for (i = sisModals.length - 1; i >= 0; i--) {
                if (sisModals[i].$blocker) {
                    sisModals[i].$blocker.toggleClass('current', !selected).toggleClass('behind', selected);
                    selected = true;
                }
            }
        };

    $.sisModal = function (el, options) {
        var remove, target;
        this.$body = $('body');
        this.options = $.extend({}, $.sisModal.defaults, options);
        this.$blocker = null;
        if (this.options.closeExisting)
            while ($.sisModal.isActive())
                $.sisModal.close(); // Close any open sisModals.
        sisModals.push(this);
        if (el.is('a')) {
            target = el.attr('href');
            this.anchor = el;
            // Select element by id from href
            if (/^#/.test(target)) {
                var targetEl = target;
                if (this.options.target !== '') {
                    targetEl = "#" + this.options.target;
                }
                this.$elm = $(targetEl);
                if (this.$elm.length !== 1) {
                    return null;
                }
                this.$body.append(this.$elm);
                this.open();
            }
        } else {
            this.$elm = el;
            if (this.options.target !== '') {
                this.$elm = $('#' + this.options.target);
            }
            this.anchor = el;
            this.$body.append(this.$elm);
            this.open();
        }
    };

    $.sisModal.prototype = {
        constructor: $.sisModal,

        open: function () {
            var m = this;
            this.block();
            this.anchor.blur();
            this.show();
            $(document).off('keydown.sisModal').on('keydown.sisModal', function (event) {
                var current = getCurrent();
                if (event.which === 27 && current.options.escapeClose) current.close();
            });


            if (this.options.draggable) {
                this.$elm.draggable({
                    cancel: "input, svg, select, label",
                    containment: ".jquery-sisModal",
                });
            }
        },

        close: function () {
            sisModals.pop();
            this.unblock();
            this.hide();
            if (!$.sisModal.isActive())
                $(document).off('keydown.sisModal');
        },

        block: function () {
            this.$elm.trigger($.sisModal.BEFORE_BLOCK, [this._ctx()]);
            this.$body.css('overflow', 'hidden');
            this.$blocker = $('<div class="' + this.options.blockerClass + ' blocker current"></div>').appendTo(this.$body);
            selectCurrent();
            this.$elm.trigger($.sisModal.BLOCK, [this._ctx()]);
        },

        unblock: function (now) {
            this.$blocker.children().appendTo(this.$body);
            this.$blocker.remove();
            this.$blocker = null;
            selectCurrent();
            if (!$.sisModal.isActive())
                this.$body.css('overflow', '');
        },

        show: function () {
            this.$elm.trigger($.sisModal.BEFORE_OPEN, [this._ctx()]);
            if (this.options.showClose) {
                if (this.$elm.html().indexOf('sisModal-header') === -1) {
                    this.sisModalHeader = $('<div class="sisModal-header"><div class="header-title">' + this.options.title + '</div><a href="#close-sisModal" rel="sisModal:close" class="close-sisModal"><i class="fas fa-times sisModal:close"></i></a></div>');
                    this.$elm.prepend(this.sisModalHeader);
                } else {
                    $(".header-title").text(this.options.title);
                }
            }
            if (this.options.width > 0) {
                this.$elm.css('width', this.options.width + 'px');
            }
            this.options.left = (document.documentElement.clientWidth / 2) - (this.$elm.innerWidth() / 2);
            this.$elm.css('display', 'inline-block').css('left', this.options.left + 'px').css('top', this.options.top + 'px');
            this.$elm.addClass(this.options.sisModalClass).appendTo(this.$blocker);
            this.$elm.css('display', 'inline-block');
            this.$elm.trigger($.sisModal.OPEN, [this._ctx()]);
        },

        hide: function () {
            this.$elm.trigger($.sisModal.BEFORE_CLOSE, [this._ctx()]);
            if (this.closeButton) this.closeButton.remove();
            var _this = this;

            this.$elm.hide(0, function () {
                _this.$elm.trigger($.sisModal.AFTER_CLOSE, [_this._ctx()]);
            });

            this.$elm.trigger($.sisModal.CLOSE, [this._ctx()]);
        },

        showSpinner: function () {
            if (!this.options.showSpinner) return;
            this.spinner = this.spinner || $('<div class="' + this.options.sisModalClass + '-spinner"></div>')
                .append(this.options.spinnerHtml);
            this.$body.append(this.spinner);
            this.spinner.show();
        },

        hideSpinner: function () {
            if (this.spinner) this.spinner.remove();
        },

        // Return context for custom events
        _ctx: function () {
            return {elm: this.$elm, $elm: this.$elm, $blocker: this.$blocker, options: this.options};
        }
    };

    $.sisModal.close = function (event) {
        if (!$.sisModal.isActive()) return;
        if (event) event.preventDefault();
        var current = getCurrent();
        current.close();
        return current.$elm;
    };

    // Returns if there currently is an active sisModal
    $.sisModal.isActive = function () {
        return sisModals.length > 0;
    };

    $.sisModal.getCurrent = getCurrent;

    $.sisModal.defaults = {
        title: '',
        left: 0,
        top: 50,
        draggable: false,
        closeExisting: true,
        escapeClose: true,
        clickClose: true,
        closeText: 'Close',
        closeClass: '',
        sisModalClass: "sisModal",
        blockerClass: "jquery-sisModal",
        spinnerHtml: '<div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div>',
        showSpinner: true,
        showClose: true,
        target: '',
        width: '',
    };

    // Event constants
    $.sisModal.BEFORE_BLOCK = 'sisModal:before-block';
    $.sisModal.BLOCK = 'sisModal:block';
    $.sisModal.BEFORE_OPEN = 'sisModal:before-open';
    $.sisModal.OPEN = 'sisModal:open';
    $.sisModal.BEFORE_CLOSE = 'sisModal:before-close';
    $.sisModal.CLOSE = 'sisModal:close';
    $.sisModal.AFTER_CLOSE = 'sisModal:after-close';
    $.sisModal.AJAX_SEND = 'sisModal:ajax:send';
    $.sisModal.AJAX_SUCCESS = 'sisModal:ajax:success';
    $.sisModal.AJAX_FAIL = 'sisModal:ajax:fail';
    $.sisModal.AJAX_COMPLETE = 'sisModal:ajax:complete';

    $.fn.sisModal = function (options) {
        if (this.length === 1) {
            new $.sisModal(this, options);
        }
        return this;
    };

    // Automatically bind links with rel="sisModal:close" to, well, close the
    // sisModal.
    $(document).on('click.sisModal', 'a[rel~="sisModal:close"]', $.sisModal.close);
    $(document).on('click.sisModal', 'a[rel~="sisModal:open"]', function (event) {
        event.preventDefault();
        $(this).sisModal();
    });
}));