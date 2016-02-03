(function () {

    $.fn.popbox4 = function (options) {
        var settings = $.extend({
            selector: this.selector,
            open: '.open',
            box4: '.box4',
            arrow: '.arrow',
            arrow_border: '.arrow-border',
            close: '.close'
        }, options);

        var methods = {
            open: function (event) {
                event.preventDefault();
            },

            close: function () {
                $("#txbConfirmRemoveElement").val("");
                $(settings['box4']).fadeOut("fast");
            }
        };

        $(document).bind('keyup', function (event) {
            if (event.keyCode == 27) { // Escape
                methods.close();
            }
        });

        $('.popbox4').keypress(function (e) {
            if (e.which == 13) { // Enter
                $("button[id*='btnConfirmRemoveElement").click();
            }
        });

        $(document).bind('click', function (event) {
            if (!$(event.target).closest(settings['selector']).length && !$(event.target).is('button') && !$(event.target).is('span') && !$(event.target).is('input')
                && !$(event.target).is('label')) {
                methods.close();
            }
        });

        return this.each(function () {
            //$(this).css({'width': $(settings['box']).width()}); // Width needs to be set otherwise popbox will not move when window resized.

            $(settings['open'], this).bind('click', methods.open);
            $(settings['open'], this).parent().find(settings['close']).bind('click', function (event) {
                event.preventDefault();
                methods.close();
            });
        });
    }

}).call(this);
