(function(){

  $.fn.popbox3 = function(options){
    var settings = $.extend({
      selector      : this.selector,
      open          : '.open',
      box3           : '.box3',
      arrow         : '.arrow',
      arrow_border  : '.arrow-border',
      close         : '.close'
    }, options);

    var methods = {
      open: function(event){
          event.preventDefault();

        var pop = $(this);
        var box3 = $('.box3');
        var btn2 = $('#btnConfirmRemoveElement');

        //box.find(settings['arrow']).css({'left': box.width()/2 - 10});
        //box.find(settings['arrow_border']).css({'left': box.width()/2 - 10});

        if (box3.css('display') == 'block') {
            methods.close();
        } else {
            box3.css('display', 'block');
            box3.css('top', btn2.offset().top);

            $('.box3').css('height', '270px');
            $('#popbox_footer3').css('margin', '20px');

            $(".box.popbox3").css('left', $(event.target).offset().left);
            $(".box.popbox3").css('top', $(event.target).offset().top + 15);
        }
      },

      close: function () {          
          $("#txbConfirmRemoveElement").val("");
          $(settings['box3']).fadeOut("fast");
      }
    };
      
    $(document).bind('keyup', function(event){
      if (event.keyCode == 27) { // Escape
          methods.close();
      }
    });

    $('.popbox3').keypress(function(e){
        if (e.which == 13) { // Enter
            $("button[id*='btnConfirmRemoveElement").click();
        }
    });

    $(document).bind('click', function (event) {
        if (!$(event.target).closest(settings['selector']).length && !$(event.target).is('button') && !$(event.target).is('span') && !$(event.target).is('input')) {
            methods.close();
        }
    });

    return this.each(function(){
        //$(this).css({'width': $(settings['box']).width()}); // Width needs to be set otherwise popbox will not move when window resized.

        $(settings['open'], this).bind('click', methods.open);
        $(settings['open'], this).parent().find(settings['close']).bind('click', function(event){
        event.preventDefault();
        methods.close();
      });
    });
  }

}).call(this);
