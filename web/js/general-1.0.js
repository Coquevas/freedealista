/**
 * FREEdealista Google Maps & idealista APIs management.
 * 
 * @author: Jorge Vas Moreno <info@freedealista.com>
 * @version: 1.0
 * 
 */

var MAP_CANVAS        = 'map-canvas',
	SHARP_MAP_CANVAS  = '#'+MAP_CANVAS,
	MARKER_DELAY      = 200,
	DEFAULT_LAT       = 40.416592,
	DEFAULT_LNG       = -3.703867,
	DEFAULT_SINCE     = 'since-w',
	DEFAULT_DISTANCE  = 1500,
	DEFAULT_MIN_PRICE = 500,
	DEFAULT_MAX_PRICE = 1000,
	LOWEST_PRICE      = 0,
	HIGHEST_PRICE     = 3000,
	STEP_PRICE        = 25,
	DEFAULT_MIN_SIZE  = 70,
	DEFAULT_MAX_SIZE  = 110,
	LOWEST_SIZE       = 0,
	HIGHEST_SIZE      = 300,
	STEP_SIZE         = 5,
	DEFAULT_ROOMS     = 0,
	LOWEST_ROOMS      = 0,
	HIGHEST_ROOMS     = 5,
	STEP_ROOMS        = 1,
	DEFAULT_FLOOR     = 1,
	LOWEST_FLOOR      = 1,
	HIGHEST_FLOOR     = 6,
	STEP_FLOOR        = 1,
	DEFAULT_FLOOR_BJ  = true,
	DEFAULT_FLOOR_EN  = true,
	DEFAULT_AGENCY    = false;

$(function () {
	// variable for caching settings
	var s = null,
	me = null,
	map = null,
	infoWindow = null,
	markers = [],
	properties = {},
	
	gMaps = {
		closeInfoWindow: function() {
			infoWindow.close();
		},
		openInfoWindow: function(marker) {
			var markerInfo = marker.infoWindow;
			infoWindow.setContent(markerInfo);
			infoWindow.open(map, marker);
		},
		
		addPropertyMarker: function (item) {
			var icon, shadow, iconImg, shadowImg, marker, contentString, contentDiv;

			contentDiv = idealista.getPropertyHtmlInfo(item);

			contentString = contentDiv.outerHtml();
			
			if(item.agency) {
				iconImg = 'img/agency.' + item.lastUpdate + '.png';
				shadowImg = 'img/agency.shadow.png';
			} else {
				iconImg = 'img/property.' + item.lastUpdate + '.png';
				shadowImg = 'img/property.shadow.png';
			}

			icon = new google.maps.MarkerImage(iconImg,
				new google.maps.Size(38.0, 32.0),
				new google.maps.Point(0, 0),
				new google.maps.Point(19.0, 32.0));
			shadow = new google.maps.MarkerImage(shadowImg,
				new google.maps.Size(55.0, 32.0),
				new google.maps.Point(0, 0),
				new google.maps.Point(19.0, 32.0));
			
			marker = new google.maps.Marker({
				map: map,
				draggable: false,
				animation: google.maps.Animation.DROP,
				position: new google.maps.LatLng(item.latitude, item.longitude),
				title: item.address + ' ('+ item.price + ' \u20ac)', // Euro Unicode
				icon: icon,
				shadow: shadow
			});
			
			marker.infoWindow = contentString;
			
			google.maps.event.addListener(marker, 'click', function() {
				gMaps.openInfoWindow(marker);
			});
			
			markers.push(marker);
			
			return marker;
		},
		
		cleanPropertyMarkers: function () {
			$.each(markers, function (i,marker){
				marker.setMap(null);
			});
			markers.length = 0;
		},
		
		renderPropertyList: function (elementList, flags) {
			var count = 0, marker, filters = {};
			$.each(elementList, function(i,item){
				if (flags.noAgency) {
					filters.noAgency = !item.agency;
				} else {
					filters.noAgency = true;
				}
				
				if (flags.floor) {
					filters.floor = (item.floor >= flags.floor);
				} else {
					filters.floor = (item.floor >= 0);
				}
				
				if (flags.bj) filters.bj = (item.floor == 'bj');
				
				if (flags.en) filters.en = (item.floor == 'en');
				
				if (filters.noAgency && (filters.floor || filters.bj || filters.en)) {
					count++;
					setTimeout(function() {
						marker = gMaps.addPropertyMarker(item);
						idealista.addPropertyListItem(item, marker);
					}, Math.pow(count,1/2) * MARKER_DELAY);
				}
			});
		}
	},

	idealista = {
		// define your oft-used settings below
		settings: {
			requestCounter: 0,
			filters: {}
		},

		// the method that initializes stuff
		init: function () {
			var address, distance;
			
			s = this.settings;
			me = this;
			
			address = new google.maps.LatLng($.cookie('address.lat'), $.cookie('address.lng'));
			if (address.equals(new google.maps.LatLng(0,0))) {
				address = new google.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG);
				$('#address').val('Madrid');
			} else {
				$('#address').val($.cookie('address.formatted'));
			}
			
			distance = parseInt($.cookie('distance'));
			if (!distance) {
				distance = DEFAULT_DISTANCE;
			}
			
			s.address = address;
			s.distance = distance;
			
			map = mapInit(MAP_CANVAS, s.address, s.distance);
			infoWindow = new google.maps.InfoWindow({maxWidth: 360});
			google.maps.event.addListener(map, 'click', gMaps.closeInfoWindow);
			
			me.styleUI();
			
			$('body').bind('area_updated', function(e){
				s.position = e.position;
				s.distance = e.distance;
				me.updateProperties(s.position, s.distance);
			});
		},
		
		styleUI: function () {
			var minPrice, maxPrice, minSize, maxSize, minRooms, minFloor, since, agency, agencyTxt = [];
			
			// Buttons
			$('#center, #geocode, #floor-bj, #floor-en').button();
			// End Buttons
			
			// Radios / Checkboxes
			// Init
			$('#since').buttonset();
			$('#specialFloors').buttonset();
			$('#agency').button();
			
			if($.cookie('since')) {
				since = $.cookie('since');
			} else {
				since = DEFAULT_SINCE;
			}
			
			switch (since) {
				case 'since-a':
					$('#since-a').attr('checked', true).button('refresh');
					s.sinceList = ['a', 'm', 'w'];
				break;
				case 'since-m':
					$('#since-m').attr('checked', true).button('refresh');
					s.sinceList = ['m', 'w'];
				break;
				case 'since-w':
				default:
					$('#since-w').attr('checked', true).button('refresh');
					s.sinceList = ['w'];
				break;
			}
			
			switch($.cookie('floor-bj')){
				case 'true': // Fake string boolean
					$('#floor-bj').attr('checked', true).button('refresh');
					s.filters.bj = true;
				break;
				case 'false': // Fake string boolean
					$('#floor-bj').attr('checked', false).button('refresh');
					s.filters.bj = false;
				break;
				default: // Undefined
					$('#floor-bj').attr('checked', DEFAULT_FLOOR_BJ).button('refresh');
					s.filters.bj = DEFAULT_FLOOR_BJ;
				break;
			}
			
			switch($.cookie('floor-en')){
				case 'true': // Fake string boolean
					$('#floor-en').attr('checked', true).button('refresh');
					s.filters.en = true;
				break;
				case 'false': // Fake string boolean
					$('#floor-en').attr('checked', false).button('refresh');
					s.filters.en = false;
				break;
				default: // Undefined
					$('#floor-en').attr('checked', DEFAULT_FLOOR_EN).button('refresh');
					s.filters.en = DEFAULT_FLOOR_EN;
				break;
			}
			
			switch($.cookie('agency')){
				case 'true': // Fake string boolean
					agency = true
				break;
				case 'false': // Fake string boolean
					agency = false
				break;
				default: // Undefined
					agency = DEFAULT_AGENCY;	
				break;
			}
			
			agencyTxt[true]  = 'Ocultar agencias';
			agencyTxt[false] = 'Mostrar agencias';
			$('#agency').attr('checked', agency).button('refresh');
			$('label[for="agency"] span').text(agencyTxt[agency]);
			s.filters.noAgency = !agency;
			
			// Action
			$('#since-a, #since-m, #since-w').click(function () {
				since = this.id;
				switch (since) {
					case 'since-a':
						s.sinceList = ['a', 'm', 'w'];
					break;
					case 'since-m':
						s.sinceList = ['m', 'w'];
					break;
					case 'since-w':
					default:
						since = 'since-w';
						s.sinceList = ['w'];
					break;
				}
				$.cookie('since', since, {expires: 7, path: '/', domain: '.freedealista.com'});
				me.updateProperties(s.position, s.distance);
			});
			
			$('#floor-bj, #floor-en, #agency').click(function () {
				var action = this.id;
				switch (action) {
					case 'floor-bj':
						s.filters.bj = this.checked;
					break;
					case 'floor-en':
						s.filters.en = this.checked;
					break;
					case 'agency':
					default:
						action = 'agency';
						s.filters.noAgency = !this.checked;
						if (this.checked){
							$('label[for="agency"] span').text('Ocultar agencias');
						}else{
							$('label[for="agency"] span').text('Mostrar agencias');
						}
					break;
				}
				$.cookie(action, this.checked, {expires: 7, path: '/', domain: '.freedealista.com'});
				me.updateProperties(s.position, s.distance);
			});
			//End Radios / Checkboxes
			
			// Price range
			// Init
			if ($.cookie('minPrice')) {
				minPrice = parseInt($.cookie('minPrice'));
			} else {
				minPrice = DEFAULT_MIN_PRICE;
			}
			
			if ($.cookie('maxPrice')) {
				maxPrice = parseInt($.cookie('maxPrice'));
			} else {
				maxPrice = DEFAULT_MAX_PRICE;
			}
			
			if (minPrice < LOWEST_PRICE)  minPrice = LOWEST_PRICE;
			if (minPrice > HIGHEST_PRICE) minPrice = LOWEST_PRICE;
			if (maxPrice < LOWEST_PRICE)  maxPrice = HIGHEST_PRICE;
			if (maxPrice > HIGHEST_PRICE) maxPrice = HIGHEST_PRICE;			
			if (minPrice > maxPrice) {
				var tmpMinPrice = minPrice;
				minPrice = maxPrice;
				maxPrice = tmpMinPrice;
			}
			
			s.minPrice = minPrice;
			s.maxPrice = maxPrice;			
			
			// Action
			$('#price-range').slider({
				range: true,
				min: LOWEST_PRICE,
				max: HIGHEST_PRICE,
				step: STEP_PRICE,
				animate: true,
				values: [s.minPrice, s.maxPrice],
				slide: function(event, ui) {
					$('#price-amount').val(
						ui.values[0] +
						' \u20ac - ' +
						((ui.values[1] == HIGHEST_PRICE)?'cualquiera':ui.values[1] + ' \u20ac')
					);
				},
				stop: function(event, ui) {
					s.minPrice = ui.values[0];
					s.maxPrice = ui.values[1];
					$.cookie('minPrice', s.minPrice, {expires: 7, path: '/', domain: '.freedealista.com'});
					$.cookie('maxPrice', s.maxPrice, {expires: 7, path: '/', domain: '.freedealista.com'});
					me.updateProperties(s.position, s.distance);
				}
			});
			$('#price-amount').val(
				$('#price-range').slider('values', 0) +
				' \u20ac - ' + 
				(($('#price-range').slider('values', 1) == HIGHEST_PRICE)?'cualquiera':$('#price-range').slider('values', 1) + ' \u20ac')
			);
			// End Price range
			
			// Size range
			// Init
			if ($.cookie('minSize')) {
				minSize = parseInt($.cookie('minSize'));
			} else {
				minSize = DEFAULT_MIN_SIZE;
			}
			
			if ($.cookie('maxSize')) {
				maxSize = parseInt($.cookie('maxSize'));
			} else {
				maxSize = DEFAULT_MAX_SIZE;
			}
			
			if (minSize < LOWEST_SIZE)  minSize = LOWEST_SIZE;
			if (minSize > HIGHEST_SIZE) minSize = LOWEST_SIZE;
			if (maxSize < LOWEST_SIZE)  maxSize = HIGHEST_SIZE;
			if (maxSize > HIGHEST_SIZE) maxSize = HIGHEST_SIZE;			
			if (minSize > maxSize) {
				tmpMinSize = minSize;
				minSize = maxSize;
				maxSize = tmpMinSize;
			}
			
			s.minSize = minSize;
			s.maxSize = maxSize;			
			
			$('#size-range').slider({
				range: true,
				min: LOWEST_SIZE,
				max: HIGHEST_SIZE,
				step: STEP_SIZE,
				animate: true,
				values: [s.minSize, s.maxSize],
				slide: function(event, ui) {
					$(
						'#size-amount').val(ui.values[0] +
						' m\u00b2 - ' +
						((ui.values[1] == HIGHEST_SIZE)?'cualquiera':ui.values[1] + ' m\u00b2')
					);
				},
				stop: function(event, ui) {
					s.minSize = ui.values[0];
					s.maxSize = ui.values[1];
					$.cookie('minSize', s.minSize, {expires: 7, path: '/', domain: '.freedealista.com'});
					$.cookie('maxSize', s.maxSize, {expires: 7, path: '/', domain: '.freedealista.com'});
					me.updateProperties(s.position, s.distance);
				}
			});
			$('#size-amount').val(
				$('#size-range').slider('values', 0) +
				' m\u00b2 - ' + 
				(($('#size-range').slider('values', 1) == HIGHEST_SIZE)?'cualquiera':$('#size-range').slider('values', 1) + ' m\u00b2')
			);
			
			// Number of rooms
			// Init
			if ($.cookie('minRooms')) {
				minRooms = parseInt($.cookie('minRooms'));
			} else {
				minRooms = DEFAULT_ROOMS;
			}
			
			if (minRooms < LOWEST_ROOMS)  minRooms = LOWEST_ROOMS;
			if (minRooms > HIGHEST_ROOMS) minRooms = HIGHEST_ROOMS;
			
			s.minRooms = minRooms;
			
			// Action
			$('#rooms-range').slider({
				range: 'max',
				min: LOWEST_ROOMS,
				max: HIGHEST_ROOMS,
				step: STEP_ROOMS,
				animate: true,
				value: s.minRooms,
				slide: function(event, ui) {
					$('#rooms-amount').val(ui.value + '+');
				},
				stop: function(event, ui) {
					s.minRooms = ui.value;
					$.cookie('minRooms', s.minRooms, {expires: 7, path: '/', domain: '.freedealista.com'});
					me.updateProperties(s.position, s.distance);					
				}
			});
			$('#rooms-amount').val($('#rooms-range').slider('value') + '+');
			// End Number of rooms
			
			// Floor number
			// Init
			if ($.cookie('minFloor')) {
				minFloor = parseInt($.cookie('minFloor'));
			} else {
				minFloor = DEFAULT_FLOOR;
			}
			
			if (minFloor < LOWEST_FLOOR)  minFloor = LOWEST_FLOOR;
			if (minFloor > HIGHEST_FLOOR) minFloor = HIGHEST_FLOOR;
			
			s.filters.floor = minFloor;
			
			$('#floor-range').slider({
				range: 'max',
				min: LOWEST_FLOOR,
				max: HIGHEST_FLOOR,
				step: STEP_FLOOR,
				animate: true,
				value: s.filters.floor,
				slide: function(event, ui) {
					$('#floor-amount').val(ui.value + '+');
				},
				stop: function(event, ui) {
					s.filters.floor = ui.value;
					$.cookie('minFloor', s.filters.floor, {expires: 7, path: '/', domain: '.freedealista.com'});
					me.updateProperties(s.position, s.distance);					
				}
			});
			$('#floor-amount').val($('#floor-range').slider('value') + '+');
			// End Floor number
			
			// Fill 100% height
			$(function() {
				$(window).resize(function() {
					$(SHARP_MAP_CANVAS).height($(window).height() - $(SHARP_MAP_CANVAS).offset().top);
					$('#loading').height($(window).height() - $('#loading').offset().top);
					$('#propertyList').height($(window).height() - $('#propertyList').offset().top);
				});
				$(window).resize();
			});
			
			$('#address').focus(function () {
				this.select();
			});
			$('#address').mouseup(function (e) {
				e.preventDefault();
			});
			
			// Remote loadder spinner
			$('#loading').hide();
			
			$('body').bind('remoteLoadStart', function(){
				$('#loading').show()
			});
			
			$('body').bind('remoteLoadStop', function(){
				$('#loading').hide()
			});
		},
		
		updateProperties: function (position, distance) {
			var since;
			
			gMaps.cleanPropertyMarkers();
			idealista.cleanPropertyListItem();
			
			properties = {};
			
			if (distance) {
				s.distance = parseInt(distance);
			}
			
			if (position) {
				s.address = position
			}
			
			$('body').trigger('remoteLoadStart');
			
			for (since in s.sinceList) {
				this.getPropertyMap(1, s.sinceList[since]);
			}
		},
		
		getPropertyMap: function (pag, since) {
			s.requestCounter++;
			
			// Clean max boundaries
			if (s.maxSize >= HIGHEST_SIZE) s.maxSize = '';
			if (s.maxPrice >= HIGHEST_PRICE) s.maxPrice = '';
			
			$.getJSON('proxy/?callback=?',
			{
				center: s.address.lat() + ',' + s.address.lng(),
				distance: s.distance,
				minPrice: s.minPrice,
				maxPrice: s.maxPrice,
				operation: 'rent',
				minSize: s.minSize,
				maxSize: s.maxSize,
				minRooms: s.minRooms,
				since: since,
				pics: '1',
				numPage: pag,
				action: 'json'
			},
			function (data) {
				me.parseXSS(data, since);
			}
			);
		},
		
		parseXSS: function (data, since) {
			if(data){
				var props = data[1];
				if (props.actualPage < props.totalPages) {
					me.getPropertyMap(props.actualPage + 1, since);
				}
				s.requestCounter--;
				me.appendJsonToPropertyList(props.elementList, since);
			} else {
				console.log('idealista.com is down');
			}
		},
		
		appendJsonToPropertyList: function (elementList, since) {
			$.each(elementList, function(){
				if (properties[this.propertyCode]) {
					if (properties[this.propertyCode].lastUpdate < since) {
						properties[this.propertyCode].lastUpdate = since;
					}
				} else {
					properties[this.propertyCode] = this;
					properties[this.propertyCode].lastUpdate = since;
				}
			});
			
			if (s.requestCounter == 0) {
				$('body').trigger('remoteLoadStop');
				gMaps.renderPropertyList(properties, s.filters);
			}
		},
		
		getPropertyHtmlInfo: function (item) {
			var wrapper, pic, content, detail;

			wrapper = $('<div></div>').addClass('property');
			pic     = $('<div></div>').addClass('pic');
			content = $('<div></div>').addClass('content');
			detail  = $('<p>').addClass('detail');
			
			$('<img/>').attr('src', item.thumbnail).appendTo(pic);
			
			$('<a>'+item.address+'</a>').attr('href', 'http://' + item.url).attr('target', '_blank').appendTo($('<h2></h2>').appendTo(content));
			$('<h2>'+item.price+' &euro;</h2>').addClass('price').appendTo(content);
			
			if (!item.showAddress) {
				$('<p>').writeAlert('Dirección aproximada').appendTo(content);
			}		
			
			$('<span>'+item.size+' m&sup2; '+item.position+'</span>').addClass('size').appendTo(detail);
			detail.append(' | ');
			$('<span>'+item.rooms+' habitaciones</span>').addClass('rooms').appendTo(detail);
			detail.appendTo(content);
			
			$('<p>Planta '+item.floor+'ª</p>').addClass('floor').appendTo(content);
			$('<p>'+idealista.lastUpdate(item.lastUpdate)+'</p>').addClass('old').appendTo(content);	
			
			pic.appendTo(wrapper);
			content.appendTo(wrapper);
			
			if(item.agency) {
				wrapper.addClass('agency');
			}
			
			return wrapper;
		},
		
		addPropertyListItem: function (item, marker) {
			var element = idealista.getPropertyHtmlInfo(item);
			element.mouseenter(function () {
				marker.setAnimation(google.maps.Animation.BOUNCE);
			});
			element.mouseleave(function () {
				marker.setAnimation(null);
			});
			$('#propertyList').append(element);
		},
		
		cleanPropertyListItem: function () {
			$('#propertyList').empty();
		},
		
		lastUpdate: function (since) {
			var text;
			switch (since) {
				case 'a':
					text = 'más de un mes';
				break;
				case 'm':
					text = 'más de una semana';
				break;
				case 'w':
				default:
					text = 'la última semana';
				break;
			}
			return text;
		}
	};

	// This line initializes the whole thing
	idealista.init();
});


// Insert/Return Outer HTML
(function($){
	$.fn.outerHtml = function(s) {
		 return (s)
			 ? this.before(s).remove()
		 : jQuery('<p>').append(this.eq(0).clone()).html();
	 }
})(jQuery);

//jQuery UI alert style box
(function($){
	$.fn.writeAlert = function(message){
		return this.each(function(){
			var $this = $(this);

			var alertHtml = '<div class="ui-widget">';
			alertHtml+= '<div class="ui-state-highlight ui-corner-all" style="padding: 0 .2em;">';
			alertHtml+= '<p>';
			alertHtml+= '<span class="ui-icon ui-icon-info" style="float:left; margin-right: .3em;"></span>';
			alertHtml+= message;
			alertHtml+= '</p>';
			alertHtml+= '</div>';
			alertHtml+= '</div>';

			$this.html(alertHtml);
		});
	}
})(jQuery);
