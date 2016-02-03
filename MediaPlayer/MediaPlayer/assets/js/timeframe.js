(function ($) {

    /////////////////////
    // MAIN ENTRY POINT
    /////////////////////

    var Timeframe = function (selector) {
        var element = $(selector);

        var timeline = new Timeline(element);
        window.timeframe_live = timeline;

        return timeline;
    };
    window.Timeframe = Timeframe;

    var defaultOptions = {
        tickHeight: 8,
        textHeight: 10
    };

    ///////////////////
    // TIMELINE CLASS
    ///////////////////

    var Timeline = function (container) {
        this.container = container;
        this.categories = [];

        this.options = {};
        for (var i in defaultOptions) {
            this.options[i] = defaultOptions[i];
        }

        this.outerWidth = this.container.innerWidth();
        this.outerHeight = 100;
        this.paddingX = 40;
        this.paddingY = 40;

        this.width = this.outerWidth - (this.paddingX * 2);
        this.height = this.outerHeight - (this.paddingY * 2);

        this.container.height(this.outerHeight);

        this.svg = $(svg("svg"))
			.attr("width", this.outerWidth)
			.attr("height", this.outerHeight)
			.attr("id", "svg_timeframe")
			//.attr("onclick", "clicked(evt)")
			.appendTo(this.container);
    };

    // Configuration

    Timeline.prototype.start = function (startString) {
        this.startDate = parseDateTimeString(startString);
        return this;
    };

    Timeline.prototype.end = function (endString) {
        this.endDate = parseDateTimeString(endString);
        return this;
    };

    Timeline.prototype.majorTicks = function (number, type) {
        this.options.majorTicks = this.options.majorTicks || {};
        this.options.majorTicks.number = number;
        this.options.majorTicks.type = type;
        return this;
    };

    Timeline.prototype.minorTicks = function (number, type) {
        this.options.minorTicks = this.options.minorTicks || {};
        this.options.minorTicks.number = number;
        this.options.minorTicks.type = type;
        return this;
    };

    Timeline.prototype.autoTicks = function () {
        //TODO: look at the range of dates and adjust accordingly
        this.majorTicks(5, "years");
        this.minorTicks(1, "minutes");
        return this;
    };

    // Adding items

    Timeline.prototype.addCategory = function (categoryData) {
        var category = {
            name: categoryData.name,
            color: categoryData.color,
            events: [],
            spans: []
        };
        this.categories.push(category);

        if (categoryData.events && categoryData.events.length) {
            for (var e = 0; e < categoryData.events.length; e++) {
                var event = categoryData.events[e];
                this.addEvent(event, category);
            }
        }

        if (categoryData.spans && categoryData.spans.length) {
            for (var s = 0; s < categoryData.spans.length; s++) {
                var span = categoryData.spans[s];
                this.addSpan(span, category);
            }
        }

        return this;
    };

    Timeline.prototype.addEvent = function (eventData, category) {
        var event = {
            name: eventData.name,
            date: parseDateTimeString(eventData.date)
        };
        category.events.push(event);
    };

    Timeline.prototype.addSpan = function (spanData, category) {
        var span = {
            id: "tlTape_" + spanData.id,
            name: spanData.name,
            start: parseDateTimeString(spanData.start),
            end: parseDateTimeString(spanData.end)
        };
        category.spans.push(span);
    };

    // Rendering

    Timeline.prototype.draw = function () {

        //Prepare to draw first...
        if (!this.options.majorTicks || !this.options.minorTicks) {
            this.autoTicks();
        }

        this.drawBackground();
        this.drawItems();

        return this;
    };

    Timeline.prototype.drawBackground = function () {

        var background = $svg.group()
			.attr("class", "background")
			.appendTo(this.svg);

        var tickHeight = this.options.tickHeight;
        var textHeight = this.options.textHeight;





        var bottomLine = $svg.line(
			this.paddingX,
			this.height + this.paddingY - textHeight - tickHeight - 0.5, // - 0.5
			this.width + this.paddingX,
			this.height + this.paddingY - textHeight - tickHeight - 0.5
		)
			.attr("stroke", "#000000")
			.attr("stroke-width", 1)
			.appendTo(background);


        // EVENTS LINE
        var bottomLine1 = $svg.line(
            this.paddingX,
            40, // 45
            this.width + this.paddingX,
            -62 // 58
        )
            .attr("stroke", "#000000")
            .attr("stroke-width", 6)
			.attr("onclick", "clicked(evt)")
            //.attr("onclick", "clicked(evt, this.getTickDate)")
            .appendTo(background);



        //Evaluo el tamaÃ±o del rango total a mostrar
        var rangeMinutes = (this.endDate - this.startDate) / 1000 / 60
        var ticksRange = ""

        //En funcion de la cantidad de minutos, uso diferentes niveles de ticks
        if (rangeMinutes < 30) {
            ticksRange = "1minute"
        }
        else if (rangeMinutes < 600) {
            ticksRange = "15minute"
        }
        else if (rangeMinutes < 1440) {
            ticksRange = "1hour"
        }
        else {
            ticksRange = "1day"
        }

        //Inicializo el tickDate con el valor de la fecha inicial, para que entre en el for
        var tickDate = new Date(this.startDate.getTime());

        //Segun el caso armo diferente la lista de puntos
        switch (ticksRange) {

            //Caso en que el tick va cada 1 minuto
            case "1minute":

                //Obtengo la fecha de la primer marca, que corresponde al primer minuto redondo que hay, a partir del startdate
                var firstTick = new Date(this.startDate.getTime());
                firstTick.setMinutes(this.startDate.getMinutes() + 1);
                firstTick.setSeconds(0);
                firstTick.setMilliseconds(0);

                //Agrego los ticks de a uno, empezando por la primer marca siguiente al startdate
                for (var deltaMinutes = 0; tickDate <= this.endDate; deltaMinutes = deltaMinutes + 1) {

                    //Obtengo la fecha del tick
                    tickDate = new Date(firstTick.getTime() + (deltaMinutes * 60 * 1000));

                    //Obtengo los elementos de la fecha del tick
                    var tickYear = tickDate.getFullYear();
                    var tickMonth = tickDate.getMonth();
                    var tickDay = tickDate.getDate();
                    var tickHour = tickDate.getHours();
                    var tickMinute = tickDate.getMinutes();
                    var tickSecond = tickDate.getSeconds();

                    //Armo la etiqueta a insertar y su posicion
                    var tickLabel = ("0" + tickHour).slice(-2) + ":" + ("0" + tickMinute).slice(-2);
                    var tickPositionX = Math.floor(this.getX(tickDate)) + 0.5;

                    var isBorderTick = (tickDate <= this.startDate || tickDate >= this.endDate);

                    if (!isBorderTick) {

                        var label = $svg.text(
							tickPositionX,
							this.height + this.paddingY,
							tickLabel,
							{
							    fill: "black",
							    "font-size": "12",
							    "text-anchor": "middle"
							}
						)
							.appendTo(background);

                        var tick = $svg.line(
							tickPositionX,
							this.height + this.paddingY - textHeight - tickHeight,
							tickPositionX,
							this.height + this.paddingY - textHeight //- 50 //
						)
							.attr("stroke", "#000000")
							.attr("stroke-width", 1)
							.appendTo(background);
                    }
                }

                break;

                //Caso en que el tick va cada 15 minutos
            case "15minute":

                //Obtengo la fecha de la primer marca, que corresponde a los primeros 15 minutos redondos que hay, a partir del startdate
                var firstTick = new Date(this.startDate.getTime());
                firstTick.setMinutes(Math.ceil(this.startDate.getMinutes() / 15) * 15); // * 15 ++++++++++++++++++++++++++++ 5
                firstTick.setSeconds(0);
                firstTick.setMilliseconds(0);

                //Agrego los ticks de a uno, empezando por la primer marca siguiente al startdate
                for (var deltaMinutes = 0; tickDate <= this.endDate; deltaMinutes = deltaMinutes + 15) { // + 15 +++++++++++++++++++++++ 5

                    //Obtengo la fecha del tick
                    tickDate = new Date(firstTick.getTime() + (deltaMinutes * 60 * 1000));

                    //Obtengo los elementos de la fecha del tick
                    var tickYear = tickDate.getFullYear();
                    var tickMonth = tickDate.getMonth();
                    var tickDay = tickDate.getDate();
                    var tickHour = tickDate.getHours();
                    var tickMinute = tickDate.getMinutes();
                    var tickSecond = tickDate.getSeconds();

                    //Armo la etiqueta a insertar y su posicion
                    var tickLabel = ("0" + tickHour).slice(-2) + ":" + ("0" + tickMinute).slice(-2);
                    var tickPositionX = Math.floor(this.getX(tickDate)) + 0.5;

                    var isBorderTick = (tickDate <= this.startDate || tickDate >= this.endDate);

                    if (!isBorderTick) {

                        var label = $svg.text(
							tickPositionX,
							this.height + this.paddingY,
							tickLabel,
							{
							    fill: "black",
							    "font-size": "12",
							    "text-anchor": "middle"
							}
						)
							.appendTo(background);

                        var tick = $svg.line(
							tickPositionX,
							this.height + this.paddingY - textHeight - tickHeight,
							tickPositionX,
							this.height + this.paddingY - textHeight
						)
							.attr("stroke", "#000000")
							.attr("stroke-width", 1)
							.appendTo(background);
                    }
                }

                break;

                //Caso en que el tick va cada 1 hora
            case "1hour":

                //Obtengo la fecha de la primer marca, que corresponde a la primer hora redonda que hay, a partir del startdate
                var firstTick = new Date(this.startDate.getTime());
                firstTick.setHours(this.startDate.getHours() + 1);
                firstTick.setMinutes(0);
                firstTick.setSeconds(0);
                firstTick.setMilliseconds(0);

                //Agrego los ticks de a uno, empezando por la primer marca siguiente al startdate
                for (var deltaHours = 0; tickDate <= this.endDate; deltaHours = deltaHours + 1) {

                    //Obtengo la fecha del tick
                    tickDate = new Date(firstTick.getTime() + (deltaHours * 60 * 60 * 1000));

                    //Obtengo los elementos de la fecha del tick
                    var tickYear = tickDate.getFullYear();
                    var tickMonth = tickDate.getMonth();
                    var tickDay = tickDate.getDate();
                    var tickHour = tickDate.getHours();
                    var tickMinute = tickDate.getMinutes();
                    var tickSecond = tickDate.getSeconds();

                    //Armo la etiqueta a insertar y su posicion
                    var tickLabel = ("0" + tickHour).slice(-2) + ":" + ("0" + tickMinute).slice(-2);
                    var tickPositionX = Math.floor(this.getX(tickDate)) + 0.5;

                    var isBorderTick = (tickDate <= this.startDate || tickDate >= this.endDate);

                    if (!isBorderTick) {

                        var label = $svg.text(
							tickPositionX,
							this.height + this.paddingY,
							tickLabel,
							{
							    fill: "black",
							    "font-size": "12",
							    "text-anchor": "middle"
							}
						)
							.appendTo(background);

                        var tick = $svg.line(
							tickPositionX,
							this.height + this.paddingY - textHeight - tickHeight,
							tickPositionX,
							this.height + this.paddingY - textHeight
						)
							.attr("stroke", "#000000")
							.attr("stroke-width", 1)
							.appendTo(background);
                    }
                }

                break;

                //Caso en que el tick va cada 1 dia
            case "1day":

                //Obtengo la fecha de la primer marca, que corresponde al primer dia que hay, a partir del startdate
                var firstTick = new Date(this.startDate.getTime());
                firstTick.setDate(firstTick.getDate() + 1);
                firstTick.setHours(0);
                firstTick.setMinutes(0);
                firstTick.setSeconds(0);
                firstTick.setMilliseconds(0);

                //Agrego los ticks de a uno, empezando por la primer marca siguiente al startdate
                for (var deltaDays = 0; tickDate <= this.endDate; deltaDays = deltaDays + 1) {

                    //Obtengo la fecha del tick
                    tickDate = new Date(firstTick.getTime() + (deltaDays * 24 * 60 * 60 * 1000));

                    //Obtengo los elementos de la fecha del tick
                    var tickYear = tickDate.getFullYear();
                    var tickMonth = tickDate.getMonth();
                    var tickDay = tickDate.getDate();
                    var tickHour = tickDate.getHours();
                    var tickMinute = tickDate.getMinutes();
                    var tickSecond = tickDate.getSeconds();

                    //Armo la etiqueta a insertar y su posicion
                    var tickLabel = ("0" + tickDay).slice(-2) + "/" + ("0" + tickMonth).slice(-2);
                    var tickPositionX = Math.floor(this.getX(tickDate)) + 0.5;

                    var isBorderTick = (tickDate <= this.startDate || tickDate >= this.endDate);

                    if (!isBorderTick) {

                        var label = $svg.text(
							tickPositionX,
							this.height + this.paddingY,
							tickLabel,
							{
							    fill: "black",
							    "font-size": "12",
							    "text-anchor": "middle"
							}
						)
							.appendTo(background);

                        var tick = $svg.line(
							tickPositionX,
							this.height + this.paddingY - textHeight - tickHeight,
							tickPositionX,
							this.height + this.paddingY - textHeight
						)
							.attr("stroke", "#000000")
							.attr("stroke-width", 1)
							.appendTo(background);
                    }
                }

                break;

            default:

                break;
        }

        //Agrego el tick correspondiente al borde inicial del rango
        var startTickDateLabel = dateToString(this.startDate);
        var startTickTimeLabel = timeToString(this.startDate);
        var startTickPositionX = Math.floor(this.getX(this.startDate)) + 0.5;

        var label = $svg.text(
			startTickPositionX,
			this.height + this.options.tickHeight + this.options.textHeight + this.paddingY - 15, // ++++ - 12
			startTickDateLabel,
			{
			    fill: "black",
			    "font-size": "12",
			    "text-anchor": "middle"
			}
		)
			.appendTo(background);

        var label = $svg.text(
			startTickPositionX,
			this.height + this.options.tickHeight + 2.5 * this.options.textHeight + this.paddingY - 15, //
			startTickTimeLabel,
			{
			    fill: "black",
			    "font-size": "12",
			    "text-anchor": "middle"
			}
		)
			.appendTo(background);

        var tick = $svg.line(
			startTickPositionX,
			this.height + this.paddingY - textHeight - 4 * tickHeight,
			startTickPositionX,
			this.height + this.paddingY - textHeight + 2 * tickHeight - 15 //
		)
			.attr("stroke", "#000000")
			.attr("stroke-width", 1)
			.attr("name", "timeframe_start")
			.appendTo(background);


        //Agrego el tick correspondiente al borde final del rango
        var endTickDateLabel = dateToString(this.endDate);
        var endTickTimeLabel = timeToString(this.endDate);
        var endTickPositionX = Math.floor(this.getX(this.endDate)) + 0.5;

        var label = $svg.text(
			endTickPositionX,
			//this.height + this.paddingY,
			this.height + this.options.tickHeight + this.options.textHeight + this.paddingY - 15, // ++++ - 12
			endTickDateLabel,
			{
			    fill: "black",
			    "font-size": "12",
			    "text-anchor": "middle"
			}
		)
			.appendTo(background);

        var label = $svg.text(
			endTickPositionX,
			//this.height + this.paddingY,
			this.height + this.options.tickHeight + 2.5 * this.options.textHeight + this.paddingY - 15, // ++++ - 12
			endTickTimeLabel,
			{
			    fill: "black",
			    "font-size": "12",
			    "text-anchor": "middle"
			}
		)
			.appendTo(background);

        var tick = $svg.line(
			endTickPositionX,
			this.height + this.paddingY - textHeight - 4 * tickHeight,
			endTickPositionX,
			this.height + this.paddingY - textHeight + 2 * tickHeight - 15 // ++++ - 12
		)
			.attr("stroke", "#000000")
			.attr("stroke-width", 1)
			.attr("name", "timeframe_end")
			.appendTo(background);



        return this;
    };

    Timeline.prototype.drawItems = function () {
        for (var c = 0; c < this.categories.length; c++) {
            var category = this.categories[c];

            for (var e = 0; e < category.events.length; e++) {
                this.drawEvent(category.events[e]);
            }

            for (var s = 0; s < category.spans.length; s++) {
                this.drawSpan(category.spans[s]);
            }
        }
        return this;
    };

    Timeline.prototype.drawEvent = function (event) {
        var x = this.getX(event.date);

        var group = $svg.group()
			.attr("class", "event")
			.appendTo(this.svg);

        var circle = $svg.circle(
			x,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY,
			5
		)
			.attr("fill", "black")
			.appendTo(group);

        var label = $svg.text(
			x,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 8,
			event.name,
			{
			    fill: "black",
			    "font-size": "12",
			    "text-anchor": "middle"
			}
		)
			.appendTo(group);
    };

    Timeline.prototype.drawSpan = function (span) {
        var startX = this.getX(span.start);
        var endX = this.getX(span.end);

        var group = $svg.group()
			.attr("class", "span")
			.attr("id", span.id)
			.appendTo(this.svg);

        var rect = $svg.rect(
			startX,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 4,
			endX - startX,
			7,
			{
			    rx: 5,
			    ry: 5
			}
		)
			.attr("fill", "black")
			.appendTo(group);

        var label = $svg.text( // ************
			(startX + endX) / 2,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 0, //- 27,
			span.name,
			{
			    fill: "black",
			    "font-size": "19", //12
			    "text-anchor": "middle"
			}
		)
			.appendTo(group);
    };

    // Utilities

    // Dada una fecha obtiene X
    Timeline.prototype.getX = function (date) {
        var dateValue = date.valueOf(); // Convierte a milisegundos
        var start = this.startDate.valueOf();
        var end = this.endDate.valueOf();

        var x = ((dateValue - start) / (end - start) * this.width) + this.paddingX;
        return isNaN(x) ? this.paddingX : x;
    };

    // YO: Dada X obtiene la fecha 
    Timeline.prototype.getTickDate = function (x) {
        var start = this.startDate.valueOf();
        var end = this.endDate.valueOf();

        //var x = ((dateValue - start) / (end - start) * this.width) + this.paddingX;
        var dateValue = ((x - this.paddingX) * (end - start) / this.width) + start;
        var dateValue2 = new Date(dateValue);

        var date_str1 = dateToString(dateValue2);
        var date_str2 = timeToString(dateValue2);
        var date_str3 = date_str1 + " " + date_str2;

        // Source: http://stackoverflow.com/questions/4673527/converting-milliseconds-to-a-date-jquery-js
        //return isNaN(date_str3) ? null : date_str3;

        return date_str3;
    };

    ////////////
    // HELPERS
    ////////////

    var parseDateTimeString = function (dateString) {

        var date = dateString.split(" ")[0];
        var time = dateString.split(" ")[1];
        var dateParts = date.split("-");

        /*
        var years = parseInt(dateParts[0], 10);
        var months = parseInt(dateParts[1], 10) - 1;	//months are 0-based
        var days = parseInt(dateParts[2], 10);
        */

        var days = parseInt(dateParts[0], 10);
        var months = parseInt(dateParts[1], 10) - 1;	//months are 0-based
        var years = parseInt(dateParts[2], 10);

        var timeParts = time.split(":");

        var hours = parseInt(timeParts[0], 10);
        var minutes = parseInt(timeParts[1], 10);
        var seconds = parseInt(timeParts[2], 10);

        var date = new Date(years, months, days, hours, minutes, seconds);


        //
        var ok = false;
        if (Object.prototype.toString.call(date) === "[object Date]") {
            // it is a date
            if (!isNaN(date.getTime())) {  
                // date is valid
                ok = true;
            }
        }

        if (!ok) { // If it fails with "-" format, try with "/"

            date = dateString.split(" ")[0];
            time = dateString.split(" ")[1];
            dateParts = date.split("/");

            days = parseInt(dateParts[0], 10);
            months = parseInt(dateParts[1], 10) - 1;	//months are 0-based
            years = parseInt(dateParts[2], 10);

            timeParts = time.split(":");

            hours = parseInt(timeParts[0], 10);
            minutes = parseInt(timeParts[1], 10);
            seconds = parseInt(timeParts[2], 10);

            date = new Date(years, months, days, hours, minutes, seconds);
        }

        return date;
    };

    var dateToString = function (date) {

        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString();
        var dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        return "".concat(yyyy).concat("-").concat(mm).concat("-").concat(dd);
    };

    var timeToString = function (date) {

        var hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

        return "".concat(hh).concat(":").concat(min).concat(":").concat(ss);
    };

    var $svg = {};

    $svg.group = function () {
        var element = $(svg("g"));
        return element;
    };

    $svg.line = function (x1, y1, x2, y2, options) { // *********** Altura de los ticks - lineas
        var element = $(svg("line"))
			.attr("x1", x1)
			.attr("y1", y1 - 17) // - 8
			.attr("x2", x2)
			//.attr("y2", y2); // ++++
            .attr("y2", y2 + 86); // + 80
        setSvgOptions(element, options);
        return element;
    };

    $svg.circle = function (cx, cy, r, options) {
        var element = $(svg("circle"))
			.attr("cx", cx)
			.attr("cy", cy)
			.attr("r", r);
        setSvgOptions(element, options);
        return element;
    };

    $svg.rect = function (x, y, width, height, options) {
        var element = $(svg("rect"))
			.attr("x", x)
			.attr("y", y)
			.attr("width", width)
			.attr("height", height);
        setSvgOptions(element, options);
        return element;
    };
     
    $svg.text = function (x, y, text, options) { // ************* Altura de los ticks - números
        var element = $(svg("text"))
			.attr("x", x)
			//.attr("y", y)
			.attr("y", y + 88) // ++++ + 80
			.text(text);
        setSvgOptions(element, options);
        return element;
    };

    function svg(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }

    function setSvgOptions(element, options) {
        if (options) {
            for (var i in options) {
                element.attr(i, options[i]);
            }
        }
    }

    // expose to global
    window.timeframe_live;


})(jQuery);
