/**
 * jquery.photobox.js
 * @author Mike Hell
 * @version 1.0
 */
(function($) {
	$.fn.photobox = function(options) {
		init();

		// Handle all images
		var img_count = $(this).length;

		$(this).each(function() {
			var $container = $("#photobox-container");
			var $thumb = $(this);
			var index = $thumb.index();

			// Handle img click
			$thumb.click(function() {
				// Display the image
				var src = $(this).attr("data-photobox-image") ? $(this).attr("data-photobox-image") : $(this).attr("src");
				$container.append('<img src="' + src + '">');

				var $img = $container.find("img");

				$container.show().addClass("active"); // Finally, display the container

				// For closing
				$("#photobox-close").click(function(e) {
					$img.remove();
					$container.hide();
				});
			});
		});

		/*================================================================*/
		/*= FUNCTIONS =*/
		/*================================================================*/
		function init() {
			// Initialize the container
			if(!$("#photobox-container").length) {
				$("body").append('<div id="photobox-container"></div>');
			    $("#photobox-container")
                .attr("z-index", 5)
				.append('<div id="photobox-close"></div>')
				.hide();
			}
		}
	};
})(jQuery);