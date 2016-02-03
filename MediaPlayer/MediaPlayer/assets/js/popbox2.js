(function(){

  $.fn.popbox2 = function(options){
    var settings = $.extend({
      selector      : this.selector,
      open          : '.open',
      box2           : '.box2',
      arrow         : '.arrow',
      arrow_border  : '.arrow-border',
      close         : '.close'
    }, options);

    var methods = {
      open: function(event){
        event.preventDefault();

        var pop = $(this);
        var box2 = $('.box2');
        var btn2 = $('#btnUploadElement');

        if (box2.css('display') == 'block') {
            methods.close();
        } else {
            box2.css('display', 'block');
            box2.css('top', btn2.offset().top);

            $('.box2').css('height', '270px');
            $('#popbox_footer2').css('margin', '20px');

            $(".box.popbox2").css('left', $(event.target).offset().left);
            $(".box.popbox2").css('top', $(event.target).offset().top + 15);
        }
      },

      close: function () {          
        $(settings['box2']).fadeOut("fast");

          // Clear values
        $("#txbComment").val("");
        $("input[id*='txbInputCameraNumber']").val("");
        $("input[id*='MyFileUpload']").val("");

        $('#btnUploadElement').removeClass("opened");
      }
    };

    $(document).bind('keyup', function(event){
      if(event.keyCode == 27){
        methods.close();
      }
    });

    $(document).bind('click', function (event) {
        if (!$(event.target).closest(settings['selector']).length &&  !$(event.target).is('button') &&  !$(event.target).is('a') &&
            !$(event.target).is('span') && !$(event.target).is('img')) {
            //if (event.target.className.toLowerCase().indexOf('opened'))
            {
                methods.close();
            }
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
