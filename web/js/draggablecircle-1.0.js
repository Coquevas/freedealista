/**
 * FREEdealista Google Maps draggable circle.
 * 
 * @author: Jorge Vas Moreno <info@freedealista.com>
 * @author: Google Maps
 * @version: 1.0
 * 
 */

var KS_ENTER = 13;

/** 
 * A distance widget that will display a circle that can be resized and will
 * provide the radius in km.
 *
 * @param {google.maps.Map} map The map to attach to.
 * @param {integer} distance Default radius distance in metters.
 *
 * @constructor
 */
function DistanceWidget(map, distance) {
	this.set('map', map);
	this.set('position', map.getCenter());

	var image = new google.maps.MarkerImage('img/center.png',
		new google.maps.Size(22.0, 36.0),
		new google.maps.Point(0, 0),
		new google.maps.Point(11.0, 36.0)
	);
	var shadow = new google.maps.MarkerImage('img/center.shadow.png',
		new google.maps.Size(41.0, 36.0),
		new google.maps.Point(0, 0),
		new google.maps.Point(11.0, 36.0)
	);
	var marker = new google.maps.Marker({
		icon: image,
		shadow: shadow,
		draggable: true,
		title: 'Arrástrame para cambiar el centro de la búsqueda'
	});
	
	// Bind the marker map property to the DistanceWidget map property
	marker.bindTo('map', this);

	// Bind the marker position property to the DistanceWidget position
	// property
	marker.bindTo('position', this);

	// Create a new radius widget
	var radiusWidget = new RadiusWidget(distance);

	// Bind the radiusWidget map to the DistanceWidget map
	radiusWidget.bindTo('map', this);

	// Bind the radiusWidget center to the DistanceWidget position
	radiusWidget.bindTo('center', this, 'position');

	// Bind to the radiusWidgets' distance property
	this.bindTo('distance', radiusWidget);

	// Bind to the radiusWidgets' bounds property
	this.bindTo('bounds', radiusWidget);

	var me = this;

	google.maps.event.addListener(marker, 'dragend', function() {
		areaUpdated(me, true);
	});
}
DistanceWidget.prototype = new google.maps.MVCObject();


/**
 * A radius widget that add a circle to a map and centers on a marker.
 *
 * @constructor
 */
function RadiusWidget(distance) {
	var circle = new google.maps.Circle({
		strokeWeight: 2,
		clickable: false
	});

	// Set the distance property value, default to 2000m.
	this.set('distance', parseInt(distance));

	// Bind the RadiusWidget bounds property to the circle bounds property.
	this.bindTo('bounds', circle);

	// Bind the circle center to the RadiusWidget center property
	circle.bindTo('center', this);

	// Bind the circle map to the RadiusWidget map
	circle.bindTo('map', this);

	// Bind the circle radius property to the RadiusWidget radius property
	circle.bindTo('radius', this, 'distance');

	// Add the sizer marker
	this.addSizer_();	
}
RadiusWidget.prototype = new google.maps.MVCObject();


/**
 * Add the sizer marker to the map.
 *
 * @private
 */
RadiusWidget.prototype.addSizer_ = function() {
	var image = new google.maps.MarkerImage('img/cross.png',
		new google.maps.Size(28.0, 13.0),
		new google.maps.Point(0, 0),
		new google.maps.Point(14.0, 6.0)
	);
	var shadow = new google.maps.MarkerImage('img/cross.shadow.png',
		new google.maps.Size(35.0, 13.0),
		new google.maps.Point(0, 0),
		new google.maps.Point(14.0, 6.0)
	);
	var sizer = new google.maps.Marker({
		icon: image,
		shadow: shadow,
		draggable: true,
		raiseOnDrag: false,
		title: 'Arrástrame para cambiar el radio de búsqueda'
	});

	sizer.bindTo('map', this);
	sizer.bindTo('position', this, 'sizer_position');

	var me = this;
	google.maps.event.addListener(sizer, 'drag', function() {
		// Set the circle distance (radius)
		me.setDistance();
	});

	google.maps.event.addListener(sizer, 'dragend', function() {
		areaUpdated(me, false);
	});
};


/**
 * Update the center of the circle and position the sizer back on the line.
 *
 * Position is bound to the DistanceWidget so this is expected to change when
 * the position of the distance widget is changed.
 */
RadiusWidget.prototype.center_changed = function() {
	var bounds = this.get('bounds');

	// Bounds might not always be set so check that it exists first.
	if (bounds) {
		var lng = bounds.getNorthEast().lng();

		// Put the sizer at center, right on the circle.
		var position = new google.maps.LatLng(this.get('center').lat(), lng);
		this.set('sizer_position', position);
	}
};

RadiusWidget.prototype.distance_changed = function() {
	var bounds = this.get('bounds');

	// Bounds might not always be set so check that it exists first.
	if (bounds) {
		var lng = bounds.getNorthEast().lng();

		// Put the sizer at center, right on the circle.
		var position = new google.maps.LatLng(this.get('center').lat(), lng);
		this.set('sizer_position', position);
	}
};


/**
 * Calculates the distance between two latlng points in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in m.
 * @private
 */
RadiusWidget.prototype.distanceBetweenPoints_ = function(p1, p2) {
	if (!p1 || !p2) {
		return 0;
	}

	var R = 6371009; // Radius of the Earth in m
	var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
	var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
	Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d;
};


/**
 * Set the distance of the circle based on the position of the sizer.
 */
RadiusWidget.prototype.setDistance = function() {
	// As the sizer is being dragged, its position changes. Because the
	// RadiusWidget's sizer_position is bound to the sizer's position, it will
	// change as well.
	var pos = this.get('sizer_position');
	var center = this.get('center');
	var distance = this.distanceBetweenPoints_(center, pos);

	// Set the distance property for any objects that are bound to it
	this.set('distance', distance);
	$.cookie('distance', distance, {expires: 7, path: '/', domain: '.freedealista.com'});
};


function mapInit(canvas, center, distance) {
	var mapDiv = document.getElementById(canvas);
	var map = new google.maps.Map(mapDiv, {
		center: center,
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	var distanceWidget = new DistanceWidget(map, distance);
	
	codeAddress(distanceWidget, true);

	$('#address').keypress(function (e) {
		if(e.which == KS_ENTER){
			this.blur();
			codeAddress(distanceWidget);
		}
	});
	
	//GEO Autocomplete
	$('#address').geo_autocomplete({
		geocoder_region: 'Spain',
		geocoder_types: 'street_address,route,intersection,political,country,sublocality,neighborhood,country',
		mapheight: 100, 
		mapwidth: 100,
		geocoder_address: true,
		select: function () {
			codeAddress(distanceWidget);
		}
	});
	
	$('#center').click(function () {
		centerMarker(distanceWidget);
	});
	
	$('#geocode').click(function () {
		codeAddress(distanceWidget);
	});
	
	return map;
}

function centerMarker(widget) {
	var map = widget.get('map');
	widget.set('position',map.getCenter());
	areaUpdated(widget, false);
}

function codeAddress(distanceWidget, autozoom) {
	var map = distanceWidget.get('map');
	var geocoder = new google.maps.Geocoder();
	var address = $('#address').val();
	geocoder.geocode( {
		'address': address,
		'region': 'es'
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			$.cookie('address.lat', results[0].geometry.location.lat(), {expires: 7, path: '/', domain: '.freedealista.com'});
			$.cookie('address.lng', results[0].geometry.location.lng(), {expires: 7, path: '/', domain: '.freedealista.com'});
			$.cookie('address.formatted', results[0].formatted_address, {expires: 7, path: '/', domain: '.freedealista.com'});
			$('#address').val(results[0].formatted_address);
			map.setCenter(results[0].geometry.location);
			centerMarker(distanceWidget);
			if (autozoom) {
				// Autocenter & zoom
				var bounds = distanceWidget.get('bounds');
				map.fitBounds(bounds);
			}
		} else {
			console.log('No se pudo encontrar la dirección por el siguiente motivo: ' + status);
		}
	});
}

function reverseGeocoding(distanceWidget) {
	var latlng = distanceWidget.get('position');
	var distance = distanceWidget.get('distance');
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		latLng: latlng
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				$.cookie('address.lat', results[0].geometry.location.lat(), {expires: 7, path: '/', domain: '.freedealista.com'});
				$.cookie('address.lng', results[0].geometry.location.lng(), {expires: 7, path: '/', domain: '.freedealista.com'});
				$.cookie('address.formatted', results[0].formatted_address, {expires: 7, path: '/', domain: '.freedealista.com'});
				$.cookie('distance', distance, {expires: 7, path: '/', domain: '.freedealista.com'});
				$('#address').val(results[0].formatted_address);
			}
		} else {
			console.log('No se pudo encontrar la dirección por el siguiente motivo: ' + status);
		}
	});
}

function areaUpdated(widget, reverseGeocode) {
	if (reverseGeocode) {
		reverseGeocoding(widget);
	}
	$('body').trigger({
		type: 'area_updated',
		position: widget.get('position'),
		distance: widget.get('distance')
	});
}