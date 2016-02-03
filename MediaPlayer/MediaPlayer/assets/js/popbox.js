(function(){

    var flag_pop1 = false;
  $.fn.popbox = function(options){
    var settings = $.extend({
      selector      : this.selector,
      open          : '.open',
      box           : '.box',
      arrow         : '.arrow',
      arrow_border  : '.arrow-border',
      close         : '.close'
    }, options);

    var methods = {
      open: function(event){
        event.preventDefault();

      },

      close: function () {          
        $(settings['box']).fadeOut("fast");
        $("#txbComment").val("");
        $("#datetimepicker1").val("");

        flag_pop1 = false;
      }
    };

    $(document).bind('keyup', function(event){
      if(event.keyCode == 27){
        methods.close();
      }
    });

    $(document).bind('click', function (event) {
        if (!$(event.target).closest(settings['selector']).length && !$(event.target).is('button') && !$(event.target).is('a') &&
            !$(event.target).is('span') && !$(event.target).is('img')) {
                methods.close();
        } else {
            //if (flag_pop1) {
              //  methods.close();
            //}
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
