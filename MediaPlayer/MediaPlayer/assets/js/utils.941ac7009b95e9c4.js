/* jshint forin:true, noarg:true, jquery:true, noempty:true, eqeqeq:true, bitwise:true, quotmark:false,
  strict:true, undef:true, unused:vars, curly:true, browser:true, indent:false, maxerr:50 */
/* global _, jQuery, inConcert, html_sanitize, html, air, MD5 */

if (!this.inConcert) {
	this.inConcert = {};
}

String.prototype.trim = function() {
	"use strict";
	return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.to_boolean = function()
{
	"use strict";
	var string = this;
	switch (String(string).toLowerCase()) {
		case "true": case "1": case "yes": case "y":
			return true;
		case "false": case "0": case "no": case "n":
			return false;
		default:
			return undefined; //you could throw an error, but 'undefined' seems a more logical reply
	}
};

(function () {
	"use strict";

	function S4() {
		/*jshint bitwise:false*/
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}

	var utils = {

		md5: function(str) {
			if ( typeof(MD5) === "function" ) {
				return MD5(str);
			}
			if ( typeof(MD5.hexdigest) === "function" ) {
				return MD5.hexdigest(str);
			}
			throw "Could not find an implementation for MD5";
		},

		/*
			funcion que ordena los items de un combo
				depende de jquery.
		*/
		sortOptions: function(id) {
			var prePrepend = "#";
			if (id.match("^#") === "#") {
				prePrepend = "";
			}
			$(prePrepend + id)
				.html($(prePrepend + id + " option")
				.sort(function (first, second)
				{
					var a = ( first.text  || "" ).toLowerCase();
					var b = ( second.text || "" ).toLowerCase();
					if (a === b) {
						return 0;
					}
					else if (a < b) {
						return -1;
					}
					else {
						return 1;
					}
				}
			));
			//selecciono la primer opciÃ³n del combo
			$(prePrepend + id + " option:first").attr("selected", "selected");
		},
		getAddressDisplayText : function(address) {
			if (!address) {
				return "";
			}
			if (!address.Type) {
				return "";
			}
			switch (address.Type.toLowerCase()) {
				case "phone":
					return address.Number;
				case "facebook":
					return address.UID;
				case "twitter":
					return address.screen_name;
				case "im":
					return address.buddy;
				case "mail":
					return address.address;
				default:
					return "";
			}
		},
		isNumber: function(v){
			return typeof v === 'number' && isFinite(v);
		},
		capitaliseFirstLetter: function(string){
			return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
		},
		getControlCharacters: function() {
			return {
				9: true, // Tab
				17: true, // Control
				18: true, // Alt
				15: true, // Command/Windows
				16: true, // Shift
				27: true, // Escape
				37: true, // Left arrow
				38: true, // Up arrow
				39: true, // Right arrow
				40: true  // Down arrow
			};
		},
		/*
			This function will return a fuzzy timestamp. i.e.:
			*a minute/hour/month ago*

			@params: date (Object || String || Number)
						* Could be a javascript date object (new Date())
						* A date string (i.e. '2013-07-03 14:05:37.878')
						* A number unix timestamp (in milliseconds since epoch, i.e. 1372865723.812)

					custom_offset (Number, Optional):
						* A delta number in milliseconds.

			@returns: fuzzy timestmap (String, i.e. "about a minute ago")

			NOTE: Also, this function will calculate the difference time between now and the campaign offset.
				If a custom offset is passed as argument, will calculate using that value.
		*/
		timeAgo: function(date, custom_offset) {
			var _T = inConcert.i18n.getString;
			var settings = {
				allowFuture: false,
				strings: {
					prefixAgo: null,
					prefixFromNow: null,
					suffixAgo: _T("ago"),
					suffixFromNow: _T("from now"),
					seconds: _T("less than a minute"),
					minute: _T("about a minute"),
					minutes: _T("%d minutes"),
					hour: _T("about an hour"),
					hours: _T("about %d hours"),
					day: _T("a day"),
					days: _T("%d days"),
					month: _T("about a month"),
					months: _T("%d months"),
					year: _T("about a year"),
					years: _T("%d years"),
					numbers: []
				}
			};

			var getTimeAgoString = function(dateTime, custom_offset) {
				var $l = settings.strings;
				var prefix = $l.prefixAgo;
				var suffix = $l.suffixAgo;

				var distanceMillis = typeof(custom_offset) !== "undefined" ? custom_offset - dateTime.getTime() : utils.getTimeDifference(dateTime.getTime(), true) * 1000;
				if (settings.allowFuture) {
					if (distanceMillis < 0) {
						prefix = $l.prefixFromNow;
						suffix = $l.suffixFromNow;
					}
					distanceMillis = Math.abs(distanceMillis);
				}

				var seconds = distanceMillis / 1000;
				var minutes = seconds / 60;
				var hours = minutes / 60;
				var days = hours / 24;
				var years = days / 365;

				function substitute(stringOrFunction, number) {
					var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
					var value = ($l.numbers && $l.numbers[number]) || number;
					return string.replace(/%d/i, value);
				}

				var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
					seconds < 90 && substitute($l.minute, 1) ||
					minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
					minutes < 90 && substitute($l.hour, 1) ||
					hours < 24 && substitute($l.hours, Math.round(hours)) ||
					hours < 48 && substitute($l.day, 1) ||
					days < 30 && substitute($l.days, Math.floor(days)) ||
					days < 60 && substitute($l.month, 1) ||
					days < 365 && substitute($l.months, Math.floor(days / 30)) ||
					years < 2 && substitute($l.year, 1) ||
					substitute($l.years, Math.floor(years));

				return $.trim([prefix, words, suffix].join(" "));
			};

			if (date instanceof Date) {
				return getTimeAgoString(date, custom_offset);
			}
			else if (typeof date === "string") {
				return getTimeAgoString(utils.parseDateTimeString(date), custom_offset);
			}
			// Dealing with a unix timestamp
			else if (typeof date === "number") {
				return getTimeAgoString(new Date(date), custom_offset);
			}
			else {
				return _T("now");
			}
		},
		parseDateTimeString : function(iso8601) {
			var s = $.trim(iso8601);
			s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
			s = s.replace(/-/,"/").replace(/-/,"/");
			s = s.replace(/T/," ").replace(/Z/," UTC");
			s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
			return utils.getDateFromString(s);
		},
		getDateFromString : function( dateTime, without_seconds ) {
			var matchDate;
			if ( without_seconds ) {
				matchDate = dateTime.match(/(\d\d\d\d)[-\/](\d\d)[-\/](\d\d)[ T](\d\d):(\d\d)/);
			}
			else {
				matchDate = dateTime.match(/(\d\d\d\d)[-\/](\d\d)[-\/](\d\d)[ T](\d\d):(\d\d):(\d\d)/);
			}
			if ( matchDate === null ) {
				throw("Invalid string date: " + dateTime);
			}
			var utcDate = new Date( Date.UTC(matchDate[1], matchDate[2] - 1, matchDate[3], matchDate[4], matchDate[5], matchDate[6]) );
			return utcDate;
		},
		//dado un string en formato canonico devuelve la cantidad en milisegundos
		getTimeFromString : function (dateTime) {
			//paso el string a un date comparable
			var utcComparison = utils.getDateFromString(dateTime);
			return utcComparison.getTime();
		},

		getStringFromDate : function( date_object, utc, type )
		{
			type = type || "full";
			var year, month, day, hours, minutes, seconds;

			if ( !date_object ) {
				date_object = new Date();
			}
			if ( utc ) {
				year    = date_object.getUTCFullYear();
				month   = date_object.getUTCMonth();
				day     = date_object.getUTCDate();
				hours   = date_object.getUTCHours();
				minutes = date_object.getUTCMinutes();
			}
			else {
				year    = date_object.getFullYear();
				month   = date_object.getMonth();
				day     = date_object.getDate();
				hours   = date_object.getHours();
				minutes = date_object.getMinutes();
			}
			seconds = "0";

			var zp = utils.zeropad;
			var date =  year + "/" + zp( month + 1 ) + "/" + zp( day );
			var hour = zp( hours ) + ":" + zp( minutes ) + ":" + zp( seconds );

			if ( type === "full" ) {
				return date + " " + hour;
			}
			else if ( type === "date" ) {
				return date;
			}
			else if ( type === "day" ) {
				return day;
			}
			else if ( type === "day-month" ) {
				return zp( month + 1 ) + "/" + zp( day );
			}
			return hour;
		},

		/**
		 * Convierte una fecha de un timezone a otro.
		 *  Ej: la current date de la maquina timezone   ( UYT - Uruguay Standard Time -> timezone -3 )
		 *      a la fecha del timezone                  ( CST - U.S. Central Standard Time -> timezone -6 )
		 *
		 *      Para realizar esta tarea, primero convierte la fecha a UTC y luego la convierte al timezone destino.
		 *
		 * @private
		 * @param  {Object date} local_date  ( optional ) - Es un objeto Date, si no se recibe como parametro la fecha y hora actual.
		 * @param  {Object}      timezone                 - El objeto timezone ( ej: el obtenido del usuario que ha iniciado sesion )
		 *
		 * @return {Object date}                          - Retorna la fecha en el timezone destino.
		 *
		 */
		convertLocalDateToTimezoneDate: function( local_date, timezone )
		{
			// http://stackoverflow.com/questions/11887934/check-if-daylight-saving-time-is-in-effect-and-if-it-is-for-how-many-hours
			Date.prototype.stdTimezoneOffset = function() {
				var jan = new Date( this.getFullYear(), 0, 1 );
				var jul = new Date( this.getFullYear(), 6, 1);
				return Math.max( jan.getTimezoneOffset(), jul.getTimezoneOffset() );
			};

			Date.prototype.dst = function() {
				return this.getTimezoneOffset() < this.stdTimezoneOffset();
			};

			// crea fecha local
			local_date = local_date || new Date();

			// convierte a milisegundos
			// agrega el offset del timezone local
			// obtiene la hora UTC en mislisegundos
			var utc = local_date.getTime() + ( local_date.getTimezoneOffset() * 60000 );

			// obtengo el offset del timezone
			var offset = parseInt( timezone.TimeZone, 10 );

			// incremento los minutos
			var time_zone_minutes =  parseInt( timezone.TimeZoneMinutes || 0, 10 );
			if ( time_zone_minutes > 0 ) {
				time_zone_minutes = ( parseInt( ( time_zone_minutes * 100 / 59 ), 10 ) / 100 );
				offset = offset + time_zone_minutes;
			}
			// incremento el horario de verano
			var daylight_saving_time =  parseInt( timezone.DaylightSavingTime || "0", 10 );
			if ( daylight_saving_time === 0 && local_date.dst() ) {
				daylight_saving_time = 1;
			}
			offset = offset + daylight_saving_time;

			// calculo la fecha para el timezone
			var timezone_date = new Date( utc + ( 3600000 * offset ) );

			//window.alert( "Local date: " + local_date.toLocaleString() + " - Converted to timezone is: " + timezone_date.toLocaleString() + "\n\nTimezone info:" + JSON.stringify( timezone ));

			// retorno un objeto date
			return timezone_date;
		},

		//dado un numero < 10 le agrega 0 adelante y vuelve como string
		zeropad: function(number) {
			var absolute_value = Math.abs(number);
			if (absolute_value < 10) {
				return "0" + absolute_value.toString();
			}
			return absolute_value.toString();
		},
		format : function(source, params) {
			if ( arguments.length === 1 ) {
				return function() {
					var args = jQuery.makeArray(arguments);
					args.unshift(source);
					return jQuery.format.apply( this, args );
				};
			}
			if ( arguments.length > 2 && params.constructor !== Array  ) {
				params = jQuery.makeArray(arguments).slice(1);
			}
			// don't choke if 'params' is missing
			if (typeof(params) === "undefined" || params === null) {
				params = [ 'undefined' ];
			}
			else if ( params.constructor !== Array ) {
				params = [ params ];
			}
			jQuery.each(params, function(i, n) {
				source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
			});
			return source;
		},
		getFileExtension : function(fileName) {
			//TODO fix this regex properly extension not correctly detected when empty
			var extension = fileName.match(/[^.]*(.)$/)[0];
			if (extension === fileName) {
				extension = "";
			}
			return extension;
		},
		getContentType : function(extension) {
			return "application/octet-stream";
		},
		//formatea segundos como HH:MM:SS
		formatSecondsAsTime : function (elapsedTime, options) {
			options = _.extend({
				with_zero_hour: true,
				with_padding  : true
			}, options);
			var hours, minutes, seconds;
			hours = Math.floor(elapsedTime / 3600);
			var minutesSecs = elapsedTime % 3600;
			minutes =  Math.floor(minutesSecs / 60);
			seconds = Math.floor(minutesSecs % 60);

			var result = "";
			if (options.with_zero_hour || hours > 0) {
				result += (options.with_padding ? utils.zeropad(hours) : hours) + ":";
			}
			result += (options.with_padding || result.length > 0) ? utils.zeropad(minutes) : minutes;
			result += ":" + utils.zeropad(seconds);
			return result;
		},
		//calcula la diferencia en segundos desde la fecha dada contra la fecha actual
		//ajustando segun el timedifference devuelto por el servidor, si piden rawSeconds se devuelve sin formatear como time MM:SS
		getTimeDifference : function (utcComparison, rawSeconds) {
			var now = new Date();
			//resto y ajusto segun la diferencia que dice el server que tengo
			var elapsedTime = ((now.getTime() - utcComparison) / 1000) + inConcert.app.getTimeOffset();
			//formateo correctamente
			elapsedTime = elapsedTime > 0 ? elapsedTime : 0;
			return rawSeconds ? elapsedTime : utils.formatSecondsAsTime(elapsedTime);
		},
		generateGuid : function () {
			return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4()).toUpperCase();
		},
		generateGuidWithSeparator : function () {
			// sample return: 1EB68EE0-3711-49A4-94DB-9610626C2EA8
			return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4()).toUpperCase();
		},
		nl2br : function(str, is_xhtml) {
			var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
			return (str + '').replace(/\r\n|\n\r|\r|\n/g, breakTag);
		},
		html2text : function(str) {
			if ( !str ) {
				return "";
			}
			var sanitized = html_sanitize(str);
			var tmp = document.createElement("DIV");
			tmp.innerHTML = sanitized;
			return tmp.textContent || tmp.innerText;
		},

		//returns a javascript object with the copied data
		plainOldObject: function(object, include_attributes) {
			var data = {};
			for (var property in object){
				if ( object.hasOwnProperty(property) )
				{
					if ( typeof include_attributes === "object") {
						if ( !include_attributes.hasOwnProperty(property) ) {
							continue;
						}
					}

					switch( typeof object[property] )
					{
						case "function":
							continue;

						case "object":
							data[property] = inConcert.Utils.plainOldObject(object[property]);
						break;

						default:
							data[property] = object[property];
					}
				}
			}
			return data;
		},
		getUrlRegexp : function () {
			var urlRegexp = /(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/ig;
			return urlRegexp;
		},
		getEmailRegexp : function (){
			return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		},

		/**
		 * remove of the string html a specific tags
		 *
		 * @private
		 * @param  {String} source_html               - source html
		 * @param  {object} remove_tags               - attributes to tags
		 *
		 * @return {String}                           - target html ( with removed tags )
		 *
		 */
		html_remove_specific_tags: function ( source_html, remove_tags )
		{
			if ( typeof source_html !== "string" || !$.isArray( remove_tags ) ) {
				return source_html;
			}

			for ( var i = 0; i < remove_tags.length; i++ ) {
				var tag = remove_tags[ i ];
				// sample regexp: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/ig
				var script_regex = new RegExp( "<" + tag + "\\b[^<]*(?:(?!<\\/" + tag + ">)<[^<]*)*<\\/" + tag + ">", "ig" );

				while ( script_regex.test( source_html) ) {
					source_html = source_html.replace( script_regex, "" );
				}
			}

			return source_html;
		},

		/**
		 * remove of the string html a specific attributes with or without value
		 *
		 * @private
		 * @param  {String} source_html               - source html
		 * @param  {object} remove_attrs              - attributes to remove
		 *
		 * @return {String}                           - target html ( with removed attrs  )
		 *
		 */
		html_remove_specific_attrs: function ( source_html, attrs )
		{
			if ( typeof source_html !== "string" || !$.isArray( attrs ) ) {
				return source_html;
			}

			var clean_up = function( attr, value )
			{
				var name = attr.name;
				if ( typeof attr.not_remove_fn === "function" ) {
					if ( attr.not_remove_fn(value) ) {
						// si no debo remover el atributo
						return;
					}
				}
				value = value || "[^\"]+";
				// sample regexp: /(onclick="[^"]+")|(onclick='[^"]+')/ig
				var string_regex = "(" + name + "=\"" + value +"\")|(" + name + "='" + value + "')";
				var script_regex = new RegExp( string_regex, "ig" );

				while ( script_regex.test( source_html) ) {
					source_html = source_html.replace( script_regex, "" );
				}
			};

			for ( var i = 0; i < attrs.length; i++ ) {
				var attr = attrs[ i ];
				if ( $.isArray( attr.values ) ) {
					for ( var j = 0; j < attr.values.length; j++ ) {
						var value = attr.values[ j ];
						clean_up( attr, value );
					}
				}
				else {
					clean_up( attr );
				}
			}

			return source_html;
		},

		/**
		 * remove attributes of the string html
		 *
		 * @private
		 * @param  {String} source_html               - source html
		 * @param  {object} remove_attrs ( optional ) - attributes to remove
		 *
		 *
		 * @return {String}                           - target html ( with removed attrs )
		 *
		 *  sample:
		 *		1 - html_remove_attrs( html );                    // remove all attributes
		 *		2 - html_remove_attrs( html, { "script": { type: "all"} } ); // remove all scripts attributes
		 *		3 - html_remove_attrs( html, { "script": { type: "some", remove: {"onclick": true, "onchange": true} } } ); // remove two scripts attributes
		 *
		 *		Reference function utils.html_remove_malicious_code
		 */
		html_remove_attrs: function ( source_html, remove_attrs )
		{
			if ( typeof source_html !== "string" ) {
				return source_html;
			}

			var FRAME    = "frame"    ;
			var IDREF    = "idref"    ;
			var NAME     = "name"     ;
			var NMTOKENS = "nmtokens" ;
			var SCRIPT   = "script"   ;
			var STYLE    = "style"    ;
			var URI      = "uri"      ;
			var OTHERS   = "others"   ;

			var attrs = {
			// frame
				'target'        : FRAME,

			// idref
				'for'           : IDREF, 'id'            : IDREF,

			// name
				'name'          : NAME,

			// nmtokens
				'class'         : NMTOKENS,

			// script
				'onblur'        : SCRIPT, 'onchange'      : SCRIPT, 'onclick'       : SCRIPT, 'ondblclick'    : SCRIPT,
				'onfocus'       : SCRIPT, 'onkeydown'     : SCRIPT, 'onkeypress'    : SCRIPT, 'onkeyup'       : SCRIPT,
				'onload'        : SCRIPT, 'onmousedown'   : SCRIPT, 'onmousemove'   : SCRIPT, 'onmouseout'    : SCRIPT,
				'onmouseover'   : SCRIPT, 'onmouseup'     : SCRIPT, 'onreset'       : SCRIPT, 'onselect'      : SCRIPT,
				'onsubmit'      : SCRIPT, 'onunload'      : SCRIPT,

			// style
				'style'         : STYLE,

			// uri
				'action'        : URI,    'archive'       : URI,    'background'    : URI,   'cite'           : URI   ,
				'classid'       : URI,    'codebase'      : URI,    'data'          : URI,   'href'           : URI   ,
				'longdesc'      : URI,    'profile'       : URI,    'src'           : URI,   'usemap'         : URI   ,

			// others
				'abbr'          : OTHERS, 'accept'        : OTHERS, 'accept-charset': OTHERS, 'align'         : OTHERS,
				'alink'         : OTHERS, 'alt'           : OTHERS, 'axis'          : OTHERS, 'bgcolor'       : OTHERS,
				'border'        : OTHERS, 'cellpadding'   : OTHERS, 'cellspacing'   : OTHERS, 'char'          : OTHERS,
				'charoff'       : OTHERS, 'charset'       : OTHERS, 'checked'       : OTHERS, 'clear'         : OTHERS,
				'code'          : OTHERS, 'codetype'      : OTHERS, 'color'         : OTHERS, 'cols'          : OTHERS,
				'colspan'       : OTHERS, 'compact'       : OTHERS, 'content'       : OTHERS, 'coords'        : OTHERS,
				'datetime'      : OTHERS, 'declare'       : OTHERS, 'defer'         : OTHERS, 'dir'           : OTHERS,
				'disabled'      : OTHERS, 'enctype'       : OTHERS, 'face'          : OTHERS, 'frame'         : OTHERS,
				'frameborder'   : OTHERS, 'headers'       : OTHERS, 'height'        : OTHERS, 'hreflang'      : OTHERS,
				'hspace'        : OTHERS, 'ismap'         : OTHERS, 'label'         : OTHERS, 'lang'          : OTHERS,
				'language'      : OTHERS, 'link'          : OTHERS, 'marginheight'  : OTHERS, 'marginwidth'   : OTHERS,
				'maxlength'     : OTHERS, 'media'         : OTHERS, 'method'        : OTHERS, 'multiple'      : OTHERS,
				'nohref'        : OTHERS, 'noresize'      : OTHERS, 'noshade'       : OTHERS, 'nowrap'        : OTHERS,
				'object'        : OTHERS, 'prompt'        : OTHERS, 'readonly'      : OTHERS, 'rel'           : OTHERS,
				'rev'           : OTHERS, 'rows'          : OTHERS, 'rowspan'       : OTHERS, 'rules'         : OTHERS,
				'scheme'        : OTHERS, 'scope'         : OTHERS, 'scrolling'     : OTHERS, 'selected'      : OTHERS,
				'shape'         : OTHERS, 'size'          : OTHERS, 'span'          : OTHERS, 'standby'       : OTHERS,
				'start'         : OTHERS, 'summary'       : OTHERS, 'tabindex'      : OTHERS, 'text'          : OTHERS,
				'title'         : OTHERS, 'type'          : OTHERS, 'valign'        : OTHERS, 'value'         : OTHERS,
				'valuetype'     : OTHERS, 'version'       : OTHERS, 'vlink'         : OTHERS, 'vspace'        : OTHERS,
				'width'         : OTHERS
			};

			var erase_attrs = []; // destination array with attrs to remove

			if ( typeof remove_attrs !== "object" ) {
			// add all attrs to remove
				$.each( attrs, function( attr_name ) { erase_attrs.push( { name: attr_name, values: null } ); } );
			}
			else {
			// add specifics attrs to remove ( type or elements )
				$.each( attrs, function( attr_name, attr_type )
				{
					var remove_attr = remove_attrs[ attr_type ];
					if ( typeof remove_attr !== "object" ) {
						return true; // continue
					}
					// type ( sample all "script" ) or specific ( script.onclick, script.onchange, etc )

					var attr_values = null;
					var not_remove_fn = function(value) { return true };
					var can_remove_attr = false;
					var type = remove_attr.type.toLowerCase();

					if ( type === "all" ) {
						can_remove_attr = true;
					}
					else if ( type === "some" )
					{
						var has_validate_remove = true;
						var not_remove = remove_attr.not_remove;
						if ( not_remove ) {
							var not_remove_attr = not_remove[ attr_name ];
							if ( typeof not_remove_attr === "boolean" ) {
								can_remove_attr = false;
								has_validate_remove = false;
							}
							else if ( typeof not_remove_attr === "function" ) {
								not_remove_fn = not_remove_attr;
							}
						}

						if ( has_validate_remove ) {
							if ( !remove_attr.remove ) {
								can_remove_attr = true;
							}
							else {
								if ( remove_attr.remove.hasOwnProperty(attr_name) ) {
									can_remove_attr = true;
									attr_values = remove_attr.remove[attr_name].with_values || null;
								}
							}
						}
					}

					if ( can_remove_attr ) {
						erase_attrs.push( { name: attr_name, values: attr_values, not_remove_fn: not_remove_fn } );
					}
				});
			}

			// remove array attrs of the html
			source_html = utils.html_remove_specific_attrs( source_html, erase_attrs );

			return source_html;
		},


		/**
		 * remove malicious code of the string html
		 *
		 * @private
		 * @param  {String} source_html               - source html
		 * @param  {object} remove_attrs ( optional ) - attributes to remove
		 *
		 * @return {String}                           - target html ( with removed attrs & tags )
		 *
		 */
		html_remove_malicious_code: function ( source_html )
		{
			// remove tags "base", "script", "style"
			var remove_tags = [ "base", "script", "style" ];
			source_html = utils.html_remove_specific_tags( source_html, remove_tags );

			//remove attrs
				// 1 - all type "script" ( onclick, onchange, etc )
				// 2 - all type "uri" ( menos <href> y <img src> )
				// 3 - type "others" ( name "type" with value "submit" )
			var remove_attrs = {
				"script": {
					type       : "all"
				},
				"uri": {
					type       : "some",
					not_remove : {
						"href": true, // no lo elimino
						"src" : function( value ) {
							return true; // no lo elimino
						}
					}
				},
				"others": {
					type       : "some",
					remove     : { "type": { with_values: [ "submit" ] } }
				}
			};
			source_html = utils.html_remove_attrs( source_html, remove_attrs );

			return source_html;
		},

		linkify: function (content, options) {
			/* original code:
			 * https://github.com/cowboy/javascript-linkify
			 * https://github.com/cowboy/javascript-linkify/blob/master/ba-linkify.js
			 * http://benalman.com/code/projects/javascript-linkify/examples/linkify/?x=%3Ca+href%3D%22aaa%22+target%3D%22_blank%22%3Eaaa%3C%2Fa%3E
			 */

			if (typeof(content) !== 'string') {
				return "";
			}
			var SCHEME = "[a-z\\d.-]+://",
				IPV4 = "(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",
				HOSTNAME = "(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",
				TLD = "(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lulv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",
				HOST_OR_IP = "(?:" + HOSTNAME + TLD + "|" + IPV4 + ")",
				PATH = "(?:[;/][^#?<>\\s]*)?",
				QUERY_FRAG = "(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",
				URI1 = "\\b" + SCHEME + "[^<>\\s]+",
				URI2 = "\\b" + HOST_OR_IP + PATH + QUERY_FRAG + "(?!\\w)",

				MAILTO = "mailto:",
				EMAIL = "(?:" + MAILTO + ")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" + HOST_OR_IP + QUERY_FRAG + "(?!\\w)",
				LINK = "<a[^>]*href=\"([^\"]*)\"[^>]*>([^\"]*)<\/a>",
				LINK_RE = new RegExp( LINK, "ig" ),

				IMG = "<img[^>]*href=\"([^\"]*)\"[^>]*>([^\"]*)<\/img>",
				IMG_RE = new RegExp( IMG, "ig" ),

				URI_RE = new RegExp( "(?:" + LINK + "|" + URI1 + "|" + URI2 + "|" + IMG + "|" + EMAIL + ")", "ig" ),
				SCHEME_RE = new RegExp( "^" + SCHEME, "i" ),
				EMAIL_RE = new RegExp( EMAIL ),
				URI1_RE = new RegExp( URI1 ),
				URI2_RE = new RegExp( URI2 ),

				quotes = {
					"'": "`",
					'>': '<',
					')': '(',
					']': '[',
					'}': '{',
					'Â»': 'Â«',
					'â€º': 'â€¹'
				},

				default_options = {
					callback: function( text, href ) {
						return href ? '<a href="' + href + '" title="' + href + '" target="_blank">' + text + '</a>' : text;
					},
					punct_regexp: /(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/,
					exclude: {email: false, uri: false}
				};

			options = options || {};

			// Temp variables.
			var arr,
				i,
				link,
				href,

				// Output HTML.
				html = '',

				// Store text / link parts, in order, for re-combination.
				parts = [],

				// Used for keeping track of indices in the text.
				idx_prev,
				idx_last,
				idx,
				link_last,

				// Used for trimming trailing punctuation and quotes from links.
				matches_begin,
				matches_end,
				quote_begin,
				quote_end;

			// Initialize options.
			for ( i in default_options ) {
				if ( options[ i ] === undefined ) {
					options[ i ] = default_options[ i ];
				}
			}

			var haveToExclude = function(val) {
				if (options.exclude.email) {
					if (EMAIL_RE.test(val)) {
						return true;
					}
				}
				if (options.exclude.uri) {
					if (URI1_RE.test(val)) {
						return true;
					}
					if (URI2_RE.test(val)) {
						return true;
					}
				}
				if (options.exclude.img) {
					if (IMG_RE.test(val)) {
						return true;
					}
				}
				return false;
			};

			// Find links.
			while ( arr = URI_RE.exec( content ) )
			{
				link = arr[0];
				idx_last = URI_RE.lastIndex;
				idx = idx_last - link.length;

				// Not a link if preceded by certain characters.
				if ( /[\/:]/.test( content.charAt( idx - 1 ) ) ) {
					continue;
				}

				// validate link already.
				var link_match = !link.match(LINK_RE);
				if (!link_match) {
					continue;
				}

				// excludes.
				if (haveToExclude(link)) {
					continue;
				}

				// Trim trailing punctuation.
				do {
					// If no changes are made, we don't want to loop forever!
					link_last = link;

					quote_end = link.substr( -1 );
					quote_begin = quotes[ quote_end ];

					// Ending quote character?
					if ( quote_begin ) {
						matches_begin = link.match( new RegExp( '\\' + quote_begin + '(?!$)', 'g' ) );
						matches_end = link.match( new RegExp( '\\' + quote_end, 'g' ) );

						// If quotes are unbalanced, remove trailing quote character.
						if ( ( matches_begin ? matches_begin.length : 0 ) < ( matches_end ? matches_end.length : 0 ) ) {
							link = link.substr( 0, link.length - 1 );
							idx_last--;
						}
					}

					// Ending non-quote punctuation character?
					if ( options.punct_regexp ) {
						link = link.replace( options.punct_regexp, function(a) {
							idx_last -= a.length;
							return '';
						});
					}
				} while ( link.length && link !== link_last );

				href = link;

				// Add appropriate protocol to naked links.
				if ( !SCHEME_RE.test( href ) ) {
					href = (
						href.indexOf( '@' ) !== -1 ? ( !href.indexOf( MAILTO ) ? '' : MAILTO ) :
						!href.indexOf( 'irc.' ) ? 'irc://' :
						!href.indexOf( 'ftp.' ) ? 'ftp://' : 'http://'
					) + href;
				}

				// Push preceding non-link text onto the array.
				if ( idx_prev !== idx ) {
					parts.push([ content.slice( idx_prev, idx ) ]);
					idx_prev = idx_last;
				}
				// Push massaged link onto the array
				parts.push([ link, href ]);
			}

			// Push remaining non-link text onto the array.
			parts.push([ content.substr( idx_prev ) ]);

			// Process the array items.
			for ( i = 0; i < parts.length; i++ ) {
				var part = parts[i];
				html += options.callback( part[0], part[1] );
			}

			// In case of catastrophic failure, return the original text;
			return html || content;
		},
		validate : function( value, type, options )
		{
			var validation_result = { success: false };

			if ( typeof( value ) !== "string" ) {
				return validation_result; // error
			}

			// filesystem validation. Used by tweety fabian
			var fileSystemValidate = function( value )
			{
				value = value.trim().toUpperCase();
				if ( value.length > 0 ) {
					if ( /^[^\\\/\:\*\?\"\<\>\|\.]+(\.[^\\\/\:\*\?\"\<\>\|\.]+)*$/.test(value) ) {

						if ( $.inArray( value, [
								"CON"  , "PRN"  , "AUX"  ,
								"NUL"  , "COM1" , "COM2" ,
								"COM3" , "COM4" , "COM5" ,
								"COM6" , "COM7" , "COM8" ,
								"COM9" , "LPT1" , "LPT2" ,
								"LPT3" , "LPT4" , "LPT5" ,
								"LPT6" , "LPT7" , "LPT8" ,
								"LPT9"] ) < 0 ) {

							validation_result.success = true;
							return validation_result;
						}
					}
				}
				validation_result.success = false;
				return validation_result;
			};

			var hourValidate = function( time )
			{
				var matchTime = time.match(/(\d\d):(\d\d)/);
				if ( !matchTime || matchTime[1] > 23 ) {
					validation_result.success = false;
					validation_result.message = "HOUR_ERROR"; //_T("Please enter hour between 0 and 23.")
					return validation_result;
				}
				if ( !matchTime[2] || matchTime[2] > 59 ) {
					validation_result.success = false;
					validation_result.message = "MINUTES_ERROR"; //_T("Please enter minutes between 0 and 59.")
					return validation_result;
				}
				validation_result.success = true;
				return validation_result;
			};

			var rangeValidate = function( number, between )
			{
				var is_number = utils.validate( number, "number" );
				if ( !is_number.success ) {
					validation_result.success = false;
					return validation_result;
				}
				// JSLINT / JSHINT: fallan pero necesito comparar por si viene un numero dentro de un string.
				if ( Math.floor( number ) != number ) {
					validation_result.success = false;
					return validation_result;
				}

				between = between || { from: 1, to: 50 }; // rango por default
				between.from = parseInt( between.from !== undefined ? between.from : 1, 10 );
				between.to = parseInt( between.to !== undefined ? between.to : 50, 10 );

				number = parseInt( number, 10 );
				if ( number < between.from || number > between.to ) {
					validation_result.success = false;
					return validation_result;
				}

				validation_result.success = true;
				return validation_result;
			};

			var match_result = function( match ) {
				validation_result.success = match === null ? false : true;
				return validation_result;
			};

			switch ( type ) {
				case "required":
					validation_result.success = value.trim().length > 0;
					return validation_result;

				case "html_element_id":
					return match_result( value.match(/^[\-a-zA-Z 0-9_.]+$/) );

				case "id":
					return match_result( value.match(/^[\-a-zA-Z0-9_.]+$/) );

				case "alpha":
					return match_result( value.match(/^[\-a-zA-Z 0-9_.@]+$/) );

				case "digits":
					validation_result = match_result( value.match(/^[0-9.]+$/) );
					if ( !validation_result.success ) {
						return validation_result;
					}
					// valido que sea integer !!!
					//    JSLINT / JSHINT: fallan pero necesito comparar por si viene un numero dentro de un string.
					validation_result.success = Math.floor( value ) == value;
					return validation_result;

				case "number":
					return match_result( value.match(/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/) ); //jquery.validator de 5.5 :D

				case "gmail":
					return match_result( value.match("(^[^@]+@gmail.com$)") );

				case "email":
					return match_result( value.match(/^((([a-z]|\d|[\\!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[\\!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i)
					);

				case "url":
					return match_result( value.match(/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i)
					);

				case "domain":
					return match_result( value.match(/^[\-a-zA-Z0-9_.]+$/) );

				case "IMUser":
					//same as email without the @ part
					return match_result( value.match(/^((([a-z]|\d|[\\!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[\\!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))$/i)
					);

				case "filesystem":
					// filesystem validation. Used by tweety fabian
					return fileSystemValidate( value );

				case "hour":
					return hourValidate( value );

				case "range":
					return rangeValidate( value, options.between );

			}

			return validation_result;
		},

		isValidMailList: function( mailList, allowed_addresses ) {
			var self = this;
			allowed_addresses = allowed_addresses || 10000000; // por poner un numero disparatado!!

			var response = {result: false, address: "", error_type: null };
			if (!mailList) {
				return response;
			}

			var length = mailList.length;
			if (length === 0) {
				return response;
			}

			var count_addresses = 0;

			var validateEmail = function( address )
			{
				count_addresses++;
				if ( count_addresses > allowed_addresses ) {
					return { result: false, address: address, error_type: "exceeded_limit_of_allowed_addresses", allowed_addresses: allowed_addresses };
				}

				var raw_address = address;
				var matches = /^\s*("<[^<>]*>"\s+|[^<>]*\s+)?(<[^<>\s]*>|[^<>\s]*)$/g.exec(address);
				if (matches) {
					var name = matches[1];
					address = matches[2];
					if ( name ) {
					// si existe un contact name, la address debe estar encerrada entre <> sino falla.
						if ( address.indexOf("<") === -1 || address.indexOf(">") === -1 ) {
							return {result: false, address: raw_address, error_type: "invalid_mail_list"};
						}
					}
					//extract mail from text, remove < and >
					address = address.replace(/<|>/g, "");
				}
				var is_email = self.validate( address.toString().trim(), "email" );
				if ( !is_email.success ) {
					if ( address.indexOf(",") === -1 ) {
						return {result: false, address: address, error_type: "invalid_mail"};
					}
					else {
						return {result: false, address: address, error_type: "invalid_mail_list"};
					}
				}

				return {result: true};
			};

			if (mailList.indexOf(";") === -1) {
				return validateEmail(mailList);
			}

			var address;
			var start = 0;
			var position = 0;
			var quotes = 0;

			while (position < length) {
				var char = mailList.charAt(position);

				if (char === ';') {
					if (quotes === 0 || quotes === 2) {
						address = mailList.substring(start, position);
						var responseValidation = validateEmail(address);
						if (!responseValidation.result) {
							return responseValidation;
						}
						start = position + 1;
						quotes = 0;
						if (position + 1 === length) {
							break;
						}
					}
					else if (quotes > 2) {
						address = mailList.substring(start, position);
						response.address    = address;
						response.error_type = "invalid_mail";
						return response;
					}
				}
				else if (char === '"') {
					quotes = quotes + 1;
				}

				if (position + 1 === length) {
					address = mailList.substring(start, position + 1);
					if (quotes !== 0 && quotes !== 2) {
						response.address    = address;
						response.error_type = "invalid_mail";
						return response;
					}
					return validateEmail(address);
				}

				position = position + 1;
			}

			response.result = true;
			return response;
		},
		validateEmails : function( emails_list, callback ) {
			for (var email_type in emails_list) {
				if (emails_list.hasOwnProperty(email_type)) {
					var definition = emails_list[email_type];
					var addresses = definition.addresses;
					if (!addresses) {
						continue;
					}
					var validateResult = this.isValidMailList( addresses, definition.allowed_addresses );
					if (!validateResult.result) {
						validateResult.type = email_type;
						callback(validateResult);
						return false;
					}
				}
			}
			return true;
		},
		getNormalizedId: function(id) {
			if (typeof(id) !== "string") {
				return "";
			}
			return id.replace(/\W+/g, "_");
		},
		unescapeAttrib : function(s) {
			if (s && s.replace) {
				return html.unescapeEntities(s);
			}
			else {
				return "";
			}
		},
		escapeAttrib: function(s) {
			if (s && s.replace) {
				return html.escapeAttrib(s);
			} else {
				return "";
			}
		},
		diffObjects: function(o1, o2) {
			// choose a map() impl.
			// you may use $.map from jQuery if you wish
			var map = Array.prototype.map?
				function(a) { return Array.prototype.map.apply(a, Array.prototype.slice.call(arguments, 1)); } :
				function(a, f) {
					var ret = new Array(a.length);
					for ( var i = 0, length = a.length; i < length; i++ ) {
						ret[i] = f(a[i], i);
					}
					return ret.concat();
				};

			// shorthand for push impl.
			var push = Array.prototype.push;

			// check for null/undefined values
			if ((!o1) || (!o2)) {
				if (o1 !== o2) {
					return [["", "null", !o1, !o2]];
				}
				return undefined; // both null
			}
			// compare types
			if ((o1.constructor !== o2.constructor) ||
				(typeof o1 !== typeof o2)) {
				return [["", "type", Object.prototype.toString.call(o1), Object.prototype.toString.call(o2) ]]; // different type

			}

			var diff;
			var innerDiff;
			// compare arrays
			if (Object.prototype.toString.call(o1) === "[object Array]") {
				if (o1.length !== o2.length) {
					return [["", "length", o1.length, o2.length]]; // different length
				}
				diff =[];
				for (var i=0; i<o1.length; i++) {
					// per element nested diff
					innerDiff = utils.diffObjects(o1[i], o2[i]);
					if (innerDiff) { // o1[i] !== o2[i]
						// merge diff array into parent's while including parent object name ([i])
						push.apply(diff, map(innerDiff, function(o, j) { o[0]="[" + i + "]" + o[0]; return o; }));
					}
				}
				// if any differences were found, return them
				if (diff.length) {
					return diff;
				}
				// return nothing if arrays equal
				return undefined;
			}

			// compare object trees
			if (Object.prototype.toString.call(o1) === "[object Object]") {
				diff =[];
				// check all props in o1
				for (var prop in o1) {
					// the double check in o1 is because in V8 objects remember keys set to undefined
					if ((typeof o2[prop] === "undefined") && (typeof o1[prop] !== "undefined")) {
						// prop exists in o1 but not in o2
						diff.push(["[" + prop + "]", "undefined", o1[prop], undefined]); // prop exists in o1 but not in o2
					}
					else {
						// per element nested diff
						innerDiff = utils.diffObjects(o1[prop], o2[prop]);
						if (innerDiff) { // o1[prop] !== o2[prop]
							// merge diff array into parent's while including parent object name ([prop])
							push.apply(diff, map(innerDiff, function(o, j) { o[0]="[" + prop + "]" + o[0]; return o; }));
						}

					}
				}
				for (var prop1 in o2) {
					// the double check in o2 is because in V8 objects remember keys set to undefined
					if ((typeof o1[prop1] === "undefined") && (typeof o2[prop1] !== "undefined")) {
						// prop1 exists in o2 but not in o1
						diff.push(["[" + prop1 + "]", "undefined", undefined, o2[prop1]]); // prop1 exists in o2 but not in o1
					}
				}
				// if any differences were found, return them
				if (diff.length) {
					return diff;
				}
				// return nothing if objects equal
				return undefined;
			}
			// if same type and not null or objects or arrays
			// perform primitive value comparison
			if (o1 !== o2) {
				return [["", "value", o1, o2]];
			}
			// return nothing if values are equal
			return undefined;
		},

		/*
			Sort arrays made of numbers, strings or objects of the same class.
			The sorting can be ascending or descending.

			@param array          (required) the array to be sorted
			@param attr           (optional) the name of the attribute to order by (for arrays of objects only)
			@param order          (optional) either "asc" or "desc", to sort the array in ascending (the default) or descending order.
			@param transformValue (optional) a function to be called for each value before being sorted
		 */
		sortArray: function( array, attr, order, transformValue )
		{
			if (!$.isArray(array)) {
				return array;
			}
			transformValue = transformValue || function(value) { return value; };
			// compute values to return by the comparison function according to the sort order
			var less_than   = (typeof(order) === "string" && order.toLowerCase() === "desc") ? 1 : -1;
			var higher_than = (-1) * less_than; // // make higher_than the opposite of less_than

			return array.sort(function(first_item, second_item)
			{
				var first_value, second_value;
				if (typeof(first_item) === "object" && attr) {
					//get the attribute value of the object
					first_value = first_item[attr];
					second_value = second_item[attr];
				}
				else {
					//numeric, string or object
					first_value = first_item;
					second_value = second_item;
				}
				if (!first_value || !second_value) {
					return 1;
				}
				first_value =  transformValue(first_value);
				second_value = transformValue(second_value);
				if (typeof(first_value) !== typeof(second_value)) {
					// Ej: Sorting array error - The values to compare are of differents types. (1500) as number, and (perro) as string.
					throw("Sorting array error - The values to compare are of differents types. (" + first_value + ") as " + typeof(first_value) + ", and (" + second_value + ") as " + typeof(second_value)) + ".";
				}

				if (typeof(first_value) === "string") {
					first_value = first_value.toLowerCase();
					second_value = second_value.toLowerCase();
				}

				if (first_value === second_value) {
					return 0;
				}
				return first_value < second_value ? less_than : higher_than;
			});
		},

		// Esta funcion a partir de un hash, retorna un array ordenado alfabeticamente.
		//	recibe:
		//		1 - hash (lista a ordenar)
		//		2 - get_value (funcion que procesa el valor a ordenar)
		//		3 - filter (funcion opcional, que es llamada cuando se recorre el hash para crear el array)
		//		4 - options (objeto opcional, contiene parametros extras ( orden asc desc, attr )
		hash_to_sorted_array: function( hash, transform_value, filter, options )
		{
			var array = [];
			if (typeof hash !== "object") {
				return array;
			}
			filter = filter || function() { return true;};
			array = [];
			$.each(hash, function(id, item)
			{
				if (filter(item)) {
					item.Id = item.Id || id;
					array.push(item);
				}
			});

			var attr = null;
			var order = null;
			if ( options ) {
				attr = options.attr || null;
				order = options.order || null;
			}

			return inConcert.Utils.sortArray( array, attr, order, transform_value );
		},

		// Esta funcion a partir de un hash, retorna un hash ordenado.
		//	recibe:
		//		1 - hash (lista a ordenar)
		//		2 - sort_transform_value_fn (funcion que procesa el valor a ordenar en el array)
		//		3 - build_hash_fn (funcion que crea el hash ordenado)
		//
		sorted_hash: function( unsorted_hash, sort_transform_value_fn, build_hash_fn )
		{
			// convierto el hash de pending en un array ordenado por fecha
			var sorted_array = utils.hash_to_sorted_array( unsorted_hash, sort_transform_value_fn );

			// ahora convierto el array ordenado en un hash ordenado.
			var sorted_hash = sorted_array.reduce(function( target_hash, item ) {
				return build_hash_fn( target_hash, item ) ;
			}, {});

			return sorted_hash;
		},

		sortTeamMembersByState: function(members, filterFn, useCampaignState) {
			if (!$.isArray(members)) {
				return [];
			}
			var customState = "OTHER";
			// order of the state.
			var membersByState = {
				'ACTIVE':                 {order: 1,  list: [] },
				'IDLE':                   {order: 2,  list: [] },
				'BUSY':                   {order: 3,  list: [] },
				'BUSY_OTHER_CAMPAIGN':    {order: 4,  list: [] },
				'BREAK':                  {order: 5,  list: [] },
				'LUNCH':                  {order: 6,  list: [] },
				'BATHROOM':               {order: 7,  list: [] },
				'AWAY':                   {order: 8,  list: [] },
				'ONLINE':                 {order: 9,  list: [] },
				'OFFLINE':                {order: 10, list: [] },
				'OTHER':                  {order: 11, list: [] }
			};
			// grouped by states
			$.each(members, function(i, member)
			{
				var state = member.campaignState || member.status.state;
				if (!membersByState.hasOwnProperty(state)) {
					state = customState;
				}
				if (!filterFn) {
					membersByState[state].list.push(member);
				}
				else {
					if (filterFn(member)) {
						membersByState[state].list.push(member);
					}
				}
			});
			// concat an sort grouped states
			members = [];
			$.each(membersByState, function(state, membersInState) {
				members = members.concat(membersInState.list.sort(function(second, first) {
					if (!first || !first.Name || !second || !second.Name){ // Related to issue: http://redmine.inconcert/issues/2398
						var first_member = JSON.stringify(first) || "undefined";
						var second_member = JSON.stringify(second) || "undefined";
						inConcert.logger.error(utils.format("sortTeamMembersByState, invalid members: first:{0}, second:{1}", first_member, second_member));
						return 1;
					}
					return (second.Name.toLowerCase() < first.Name.toLowerCase()) ? -1 : 1;
				}));
			});
			return members;
		},
		//Will remove special characters like "Ã¡" or "Ã " for search purposes.
		//So that "Sebastian" matches "SebastiÃ¡n" and viceversa.
		removeSpecialChars: function(searchString) {
			if (!searchString) {
				return searchString;
			}
			//http://lehelk.com/2011/05/06/script-to-remove-diacritics/
			var diacriticsRemovalMap = [
				{'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
				{'base':'AA','letters':/[\uA732]/g},
				{'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
				{'base':'AO','letters':/[\uA734]/g},
				{'base':'AU','letters':/[\uA736]/g},
				{'base':'AV','letters':/[\uA738\uA73A]/g},
				{'base':'AY','letters':/[\uA73C]/g},
				{'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
				{'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
				{'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
				{'base':'DZ','letters':/[\u01F1\u01C4]/g},
				{'base':'Dz','letters':/[\u01F2\u01C5]/g},
				{'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
				{'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
				{'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
				{'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
				{'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
				{'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
				{'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
				{'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
				{'base':'LJ','letters':/[\u01C7]/g},
				{'base':'Lj','letters':/[\u01C8]/g},
				{'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
				{'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
				{'base':'NJ','letters':/[\u01CA]/g},
				{'base':'Nj','letters':/[\u01CB]/g},
				{'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
				{'base':'OI','letters':/[\u01A2]/g},
				{'base':'OO','letters':/[\uA74E]/g},
				{'base':'OU','letters':/[\u0222]/g},
				{'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
				{'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
				{'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
				{'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
				{'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
				{'base':'TZ','letters':/[\uA728]/g},
				{'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
				{'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
				{'base':'VY','letters':/[\uA760]/g},
				{'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
				{'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
				{'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
				{'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
				{'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
				{'base':'aa','letters':/[\uA733]/g},
				{'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
				{'base':'ao','letters':/[\uA735]/g},
				{'base':'au','letters':/[\uA737]/g},
				{'base':'av','letters':/[\uA739\uA73B]/g},
				{'base':'ay','letters':/[\uA73D]/g},
				{'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
				{'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
				{'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
				{'base':'dz','letters':/[\u01F3\u01C6]/g},
				{'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
				{'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
				{'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
				{'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
				{'base':'hv','letters':/[\u0195]/g},
				{'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
				{'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
				{'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
				{'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
				{'base':'lj','letters':/[\u01C9]/g},
				{'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
				{'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
				{'base':'nj','letters':/[\u01CC]/g},
				{'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
				{'base':'oi','letters':/[\u01A3]/g},
				{'base':'ou','letters':/[\u0223]/g},
				{'base':'oo','letters':/[\uA74F]/g},
				{'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
				{'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
				{'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
				{'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
				{'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
				{'base':'tz','letters':/[\uA729]/g},
				{'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
				{'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
				{'base':'vy','letters':/[\uA761]/g},
				{'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
				{'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
				{'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
				{'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
			];
			for(var i=0; i<diacriticsRemovalMap.length; i++) {
				searchString = searchString.replace(diacriticsRemovalMap[i].letters, diacriticsRemovalMap[i].base);
			}
			return searchString;
		},
		//
		// From JavaScript Patterns by Stoyan Stefanov, page 127
		//
		inherit: function(new_class, parent) {
			var f = function () {};
			f.prototype = parent.prototype;
			new_class.prototype = new f();
			new_class.uber = parent.prototype;
			new_class.prototype.constructor = new_class;
		},

		// Compresses (deflates) a file into a bytestream.
		compress_file: function(file)
		{
			var bytearray = new air.ByteArray();
			var readFilestream = new air.FileStream();

			// read file contents into a bytearray
			readFilestream.open(file, air.FileMode.READ);
			readFilestream.readBytes(bytearray, 0, readFilestream.bytesAvailable);
			readFilestream.close();

			bytearray.compress(air.CompressionAlgorithm.DEFLATE);

			return bytearray;
		},

		getIdWithoutVCC: function(id)
		{
			if (typeof id !== "string") {
				return "";
			}
			var match = id.match(new RegExp(/^(.+)@([^@]+)$/));
			return match ? match[1] : id;
		},

		css: {
			add: function(info)
			{
				/*
				 * Create link on head page
				 *
				 * sample result:
				 * <head>
				 *  ..
				 *  <link rel="stylesheet" type="text/css" href="/inconcert/apps/administration/css/administrationManagementResults.afd076c762bb3fb7.css" />
				 *  ..
				 * </head>
				 *
				 * require object "info"
				 *  info = {id="new_dom_element_id", href="/inconcert/apps/administration/css/administrationManagementResults.afd076c762bb3fb7.css"}
				 *
				 */
				if (typeof info !== "object" || typeof info.id !== "string" || typeof info.id !== "string") {
					return;
				}
				var element = document.getElementById(info.id);
				if (element) {
					// already exist
					return;
				}

				var css_link = document.createElement("link");

				css_link.setAttribute( "id",   info.id      );
				css_link.setAttribute( "href", info.href    );
				css_link.setAttribute( "rel",  "stylesheet" );
				css_link.setAttribute( "type", "text/css"   );

				document.getElementsByTagName("head")[0].appendChild(css_link);
			},
			remove: function(id)
			{
				var element = document.getElementById(id);
				if (!element) {
					// not exist
					return;
				}
				document.getElementsByTagName("head")[0].removeChild(element);
			}
		},

		cloneObject: function( source ) {
			var target = {};
			$.extend(true, target, source || {});
			return target;
		},

		cloneArray: function( source ) {
			var target = ( source || [] ).concat();
			return target;
		},

		truncateWord: function( word, max_length ) {
			if ( typeof word !== "string" || word.length === 0 ) {
				return "";
			}
			max_length = max_length || 50;
			if ( word.length > max_length ) {
				var dots = "......";
				word = word.substring( 0, ( max_length - dots.length) ) + dots;
			}
			return word;
		},

		/**
		* Builds a normalized account id, based on its proxy type.
		*/
		normalize_account_id: function ( account, account_id )
		{
			if(typeof account !== "object" ) {
				throw("utils.prototype.normalize_account_id: account is not a object");
			}
			if( typeof account.proxyType !== "string" ) {
				throw("utils.prototype.normalize_account_id: account.proxyType is not a string");
			}

			if( typeof account_id !== "string" ) {
				throw("utils.prototype.normalize_account_id: account_id must be a string");
			}

			// adds the proxy type if it hasn't been added yet
			var match = account_id.match( new RegExp("^" + account.proxyType + "_"));
			if( match ) {
				return account_id;
			}
			// sadly, WEBCHAT is a special case, since the proxy type is CHAT
			if( account.proxyType.toLowerCase() === "chat" ) {
				match = account_id.match( new RegExp("^WEBCHAT_"));
				if(match) {
					return account_id;
				}
			}
			// Just add the proxy type to the account id
			return utils.format( "{0}_{1}", account.proxyType, account_id );
		},

		/*
		Esta funcion realiza scroll a una posicion determinada ( TOP, BOTTOM, o la posicion donde encuentre un elemento )
		recibe un objeto con: 
			{
				$scroll     (requerido)     -> objeto jQuery contenedor de la lista. 
				destination (requerido)     -> ( "top", "bottom", "item_position" )
				type        (no requerido)  -> ("without_animation" o undefined), indica el scroll se realiza con una animacion.
				$item                       -> es el item a cual se debe de desplazar cuando destination="item_position", y en este caso es requerido.
				callback    (no requerido)  -> callback que se invoca luego de realizar el scroll
			}

		//TODO: esta funcion deberia en algun nuevo archivo en shared/gui/...js 
			De momento queda aca :D
		*/
		scroll_to: function( params )
		{
			var destination = params.destination;
			var scroll_type = params.type;
			var callback = params.callback || function() {};

			var $scroll = params.$scroll;
			if ( !$scroll || $scroll.size() === 0 ) {
				return;
			}

			var animation = { scrollTop: 0 };

			switch( destination )
			{
				case "top":
					animation.scrollTop = 0;
				break;

				case "bottom":
					var scroll_height = $scroll.prop("scrollHeight");
					var height = $scroll.height();
					animation.scrollTop = scroll_height - height;
				break;

				case "item_position":
					if ( !params.$item || params.$item.size() === 0 ) {
						return;
					}
					// // antes de realizar el scroll a la posicion del elemento, tengo que realizar scroll "top", sino la posicion del elemento da frtuas!!
					utils.scroll_to( {
						$scroll     : $scroll,
						destination : "top",
						type        : "without_animation"
					});
					// ahora si, voy por el scroll que quiero realmente
					var increase_position = params.increase_position || 0;
					var position = params.$item.offset().top;
					animation.scrollTop = position + increase_position;
				break;

				default:
					throw("scroll error");
			}

			var scroll = function( time_ms ) {
				$scroll.animate( animation, time_ms, "linear",
					function() {
						callback();
					});
			};

			if ( scroll_type === "without_animation" ) {
				scroll( 0 );
			}
			else {
			// default
				var wait_time_ms = 250;
				window.setTimeout(function() {
					var scroll_time_ms = 250;
					scroll( scroll_time_ms );
				}, wait_time_ms);
			}
		},

		/*
		Funcion que recorre un array/hash en un timeout. La misma es util, para cargar muchos elementos en el DOM y que el navegador no quede colgado mientras itera sobre el array, y que por ejemplo se pueda perder conexion con el server, etc.

			-La misma recorre array con un tope de registro a iterar (ej:50), una vez que alcanza a este tope, invoca nuevamente a una funcion de forma recursiva, que se ejecute en un timeout, hasta completar la totalidad de los elementos del array.
			-Al ir iterando cada item de este, array se invoca a una funcion (callback) que se recibe por parametro, para que por ejemplo inserte en el DOM el item.
			-Cuando finaliza, se invoca a otro callack indicando que ha terminado de iterar.

			- Contenido del parametro recibido:
			{
				rows                    (requerido)                  -> lista a recorrer (array/hash). 
				append_fn               (requerido)                 -> callback que es invocado por cada item que se recorre.
				max_append_per_loop     (no requerido) (default 50) -> Cantidad de items que se iteraran por invocacion a la funcion recursiva.
				pause_between_loop_ms   (no requerido) (default 10) -> Tiempo en milisegundos de la pausa que se realizara en el timeout antes de ejecutar nuevamente a la funcion recursiva.
				waiting_message         (no requerido)              -> Mensaje a formtear, Ejemplo: _T("Por favor espere, se han agregado {0} registros de {1}").
				waiting_fn              (no requerido)              -> callback que se invoca cuando la funcion se comienza invocar de forma recuersiva. Es util para mostrar un waiting con progreso de la cantidad de items que se van cargando. Ej 30 rows de 1500.
				complete_fn             (no requerido)              -> callback que se invoca cuando se ha completado de recorrer el array.
			}
		*/
		foreach_timeout: function( params )
		{
			if ( !params ) {
				throw("Utils.foreach_timeout 'params' is required");
			}
			if ( !params.rows ) {
				throw("Utils.foreach_timeout 'params.rows' is required");
			}
			var is_array = $.isArray(params.rows);
			var rows = is_array ? utils.cloneArray(params.rows) : utils.cloneObject(params.rows);

			var append_fn = params.append_fn;
			if ( !append_fn ) {
				throw("Utils.foreach_timeout 'params.append_fn' is required");
			}
			var waiting_fn = params.waiting_fn || function() {};
			var complete_fn = params.complete_fn || function() {};
			var waiting_message = params.waiting_message;
			var _T = inConcert.i18n.getString;

			// a la carga de los rows la agrego en un timeout, para que se pueda visualizar el mensaje de waiting.
			// ya que sino el mismo no se visualiza si tiene muchos rows y comienza a agregar en el DOM.

			// esta funcion muestra un mensaje informativo en el cual va inidicando la cantidad de rows que se van cargando.
			//
			var count_total_rows = ( is_array ? rows : Object.keys(rows) ).length;
			var show_loading = function( count_added )
			{
				count_added = count_added > count_total_rows ? count_total_rows : count_added;
				var message;
				if ( count_added === undefined ) {
					message = _T("Please wait.");
				}
				else {
					message = utils.format( waiting_message || _T("Please wait, adding rows, {0} of {1}."), count_added, count_total_rows );
				}
				waiting_fn( message );
			};

			// Esta funcion es una funcion recursiva y es la encargada de cargar los rows en el markup
			// La misma se ejecuta dentro de un timeout minimo, y se va cargando de a unos 50 elementos, luego se invoca nuevamente hasta terminar la carga.
			// Se ejecuta dentro de un timeout, para que el navegador no quede colgado, en el loop y en la carga del DOM, si es que tiene muchos rows.
			// Tambien es ejecutada dentro del timeout, porque sino el mensaje de info de la funcion 'show_loading', no se visualiza en pantalla cuando comienza el loop.

			var max_append_per_loop = params.max_append_per_loop || 50;
			var pause_between_loop_ms = params.pause_between_loop_ms || 10;
			var added = 0;

			var append_rows = function( count_added )
			{
				show_loading( count_added );

				// timeout que contiene la funcion que carga los rows.
				window.setTimeout( function() 
				{
					var added_in_loop = 0;
					var marked_to_delete = [];

					// itero sobre los rows hasta llegar al tope por timeout
					$.each( rows, function( key, row )
					{
						append_fn(row); // invoco al callback para que realice su tarea (ej: agregar al DOM)
						added_in_loop++;
						added++;
						marked_to_delete.push(key); // lo marco para ser eliminado del array principal, ya que el mismo ya fue procesado
						if ( added_in_loop === max_append_per_loop ) {
							// llegue al tope de rows a procesar por timeout, salgo del loop
							return false; // break
						}
					});

					//realizo clean up de los que ya se han iterado/procesado
					$.each( marked_to_delete.reverse(), function( _, key )
					{
						if ( is_array ) {
							rows.splice(key, 1);
						}
						else {
							delete rows[key];
						}
					});

					if ( added === count_total_rows ) {
						// FIN. muestro mensaje de que se ha completado la carga, cargo los rows en el DOM e invoco a la funcion que carga los datos del detalle.
						// el Append al DOM lo tengo que realizar en un timeout, porque sino el ultimo row de info de que se ha cargado correctamente, no es visualizado.
						show_loading( added );
						window.setTimeout(function() {
							waiting_fn();
							complete_fn();
						}, pause_between_loop_ms);
					}
					else if ( added < count_total_rows ) {
						// si aun quedan rows por cargar invoca la misma funcion recursiva
						append_rows( added );
					}
					else {
						// aca no deberia llegar jamas si sucede esto hay un error en el algortimo y hay que revisar!!!
						throw("inConcert.Utils.foreach_timeout: Bug in code, please Fix Me. Added '" + added + "' of '" + count_total_rows + "'.");
					}

				}, pause_between_loop_ms);
			};

			// aca comienza la carga de los rows
			append_rows();
		},

		/**
		* Reemplaza un conjunto de varialbes ( {AGENT}, {COMPANY_NAME}, {CAMPAIGN_NAME}, etc ) del sistema, o variables customs y retorna el resultado.
		--
			@params  : params (Object)
							params.text         - String - Requerido - Texto a reemplazar con variables a reemplazar.
							params.custom_vars  - Array  - Optional  - Variables custom a reemplazar.
							params.data         - Object - Optional  - Datos extras, como por ejemplo el id de la campana-> data.campaign_id.

			@returns :string con varialbes reemplazadas.
		*/
		replace_vars: function ( params )
		{
			if ( typeof params !== "object" ) {
				throw "inConcert.Utils.replace_vars : params not a object";
			}
			var text = params.text;
			if ( typeof text !== "string" ) {
				throw "inConcert.Utils.replace_vars : text not a string";
			}
			var custom_vars = params.custom_vars;
			if ( custom_vars && !$.isArray( custom_vars )) {
				throw "inConcert.Utils.replace_vars : custom_vars not a array";
			}

			// obtengo la campana si es que viene como parametro
			var data = params.data || {};
			var campaign_id = data.campaign_id;
			var campaign;
			if ( campaign_id ) {
				campaign = inConcert.app.getCampaign(campaign_id);
			}

			var vars = [
			// User
				{ word : "{AGENT}",                  replace : function() { return inConcert.app.getLoggedUserId();                        } },
				{ word : "{AGENTNAME}",              replace : function() { return inConcert.app.getLoggedUserName();                      } },
				{ word : "{AGENT_COMPLETE_NAME}",    replace : function() { return inConcert.app.getLoggedUserCompleteName();              } },
				{ word : "{AGENT_FIRST_NAME}",       replace : function() { return inConcert.app.getLoggedUserFirstName();                 } },
				{ word : "{AGENT_MIDDLE_NAME}",      replace : function() { return inConcert.app.getLoggedUserLastName();                  } },
				{ word : "{AGENT_LAST_NAME}",        replace : function() { return inConcert.app.getLoggedUserFirstSurname();              } },
				{ word : "{AGENT_LAST_NAME_SECOND}", replace : function() { return inConcert.app.getLoggedUserLastSurname();               } },

			// Company
				{ word : "{COMPANY_NAME}",           replace : function() { return inConcert.app.get_vcc_company_name();                   } },
				{ word : "{COMPANY_ADDRESS}",        replace : function() { return inConcert.app.get_vcc_company_address();                } },
				{ word : "{CONTACT_EMAIL}",          replace : function() { return inConcert.app.get_vcc_contact_email();                  } },
				{ word : "{CONTACT_NAME}",           replace : function() { return inConcert.app.get_vcc_contact_name();                   } },
				{ word : "{COMPANY_DESCRIPTION}",    replace : function() { return inConcert.app.get_vcc_description();                    } },
				{ word : "{COMPANY_TELEPHONES}",     replace : function() { return inConcert.app.get_vcc_company_telephones().toString();  } },

			// Campaign
				{ word : "{CAMPAIGN_NAME}",          replace : function() { return campaign ? campaign.Name : "";                          } },
				{ word : "{CAMPAIGN_DESCRIPTION}",   replace : function() { return campaign ? campaign.Description : "";                   } },
				{ word : "{CAMPAIGN}",               replace : function() {
						if ( !campaign_id ) {
							return "";
						}
						if ( campaign_id.match( inConcert.app.idAtVCCRegExp ) ) {
							return RegExp.$1; // el id de la campana sin el VCC
						}
						return campaign_id;
					}
				}

			].concat(custom_vars || []);

			$.each(vars, function(_, variable)
			{
				if ( typeof variable.word !== "string" ) {
					throw "inConcert.Utils.replace_vars : word not a string";
				}
				if ( typeof variable.replace !== "function" ) {
					throw "inConcert.Utils.replace_vars : replace not a function";
				}
				text = text.split(variable.word).join(variable.replace());
			});
			return text;
		}
	};

	//Define functions and objects in the namespace in case they don't already exist
	if (typeof inConcert.Utils !== 'function') {
		inConcert.Utils = utils;
	}
}());
