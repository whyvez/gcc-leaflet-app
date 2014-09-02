'use strict';

function app(window, document, L) {
    var menuStack = [];
    var trailsFilter = '';
    var trail = {};
    var trails = {};
    var ratings = {
        'double-black': '&#9830;&#9830;',
        'black': '&#9830;',
        'blue': '&#9632;',
        'green': '&#9679;',
        'road': '&#9679;'
    };
    var marker;

    L.RotatedMarker = L.Marker.extend({
        options: { angle: 20 },
        _setPos: function(pos) {
            L.Marker.prototype._setPos.call(this, pos);

            if(this.options.angle){
                if (this.options.angle < 45) {
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + (360 - this.options.angle) + 'deg)';
                } else {
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + (this.options.angle - 45) + 'deg)';
                }
            }
        }
    });
    L.rotatedMarker = function(pos, options) {
        return new L.RotatedMarker(pos, options);
    };

    var map = L.mapbox.map('map', 'tesera.jcjiekfo', {
        center: [51.2651, -116.9515],
        zoom: 13,
        gridLayer: false, 
        maxZoom: 18
    });

    var trailsMenu = document.getElementById('trails');

    function toggleMenu(){
        var oc = document.getElementById('menu');
        oc.classList.toggle('expanded');
        return false;
    }

    function toggleSubMenu(submenu, filter){
        var sm = document.getElementById(submenu);
        sm.classList.toggle('menu-active');
        if (trailsFilter) trailsMenu.classList.remove(trailsFilter);
        trailsMenu.classList.add(filter);
        trailsFilter = filter;
        menuStack.push(sm);
        return false;
    }

    function back(){
        if (menuStack.length > 0){
            var last = menuStack.pop();
            last.classList.toggle('menu-active');
            if (trailsFilter) trailsMenu.classList.remove(trailsFilter);
            return false;
        }
    }

    function showTrail(trailIndex){
        toggleMenu();
        if(trail) map.removeLayer(trail);
        trail = L.geoJson(trails.features[trailIndex], {
            style: function (feature) {
                return {color: '#e9627d'};
            }
        });
        setTimeout(function () {
            map.fitBounds(trail.getBounds());
        }, 500);
        setTimeout(function () {
            map.addLayer(trail);
        }, 1000);
    }

    function fetchTrails(callback){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/trails.json', true);

        xhr.onload = function(e) {
          if (this.status == 200) {
            var trails = JSON.parse(e.target.responseText);
            callback(null, trails)
          }
        };

        xhr.send();
    }

    function renderTrailsList(trails){
        trails.forEach(function (trail, i) {
            var item = document.createElement('li')
            var spans = {};

            item.classList.add('menu-item');
            for (var key in trail.properties) {
                if (trail.properties[key]) {
                    switch(key){
                    case 'rating':
                    case 'maparea':
                        var val = trail.properties[key].toLowerCase().split(' ').join('-');
                        item.classList.add(['category', key, val].join('-'));
                        break;
                    case 'distance':
                        var val = Math.round(trail.properties[key]);
                        if(val < 2) val = 'lt2'
                        if(val > 2 && val < 5) val = '2to5'
                        if(val > 5) val = 'gt5'
                        item.classList.add('category-distance-' + val);
                        break;
                    }
                }
            }

            ['rating', 'name'].forEach(function (label) {
                var span = document.createElement('span')
                span.classList.add('trail-'+label);
                if (label == 'rating') {
                    var rating = trail.properties['rating'].toLowerCase().split(' ').join('-');
                    span.innerHTML = ratings[rating];
                    span.classList.add('trail-rating', 'trail-rating-' + rating);
                } else {
                    span.textContent = trail.properties[label];
                }
                item.setAttribute('onClick', 'app.showTrail(' + i + ')')
                item.appendChild(span);
                spans[label] = span
            });

            trailsMenu.appendChild(item);
        });
    }


    var viewSet = false;
    map.on('locationfound', function (e) {
        if ( !map.hasLayer(marker) ){
             marker = L.rotatedMarker(e.latlng, {
              icon: L.icon({
                iconUrl: './images/location28.png'
              })
            });
            marker.addTo(map);
        }
        
        if (e.heading) marker.options.angle = e.heading;
        marker.setLatLng(e.latlng);

        
        // if (!viewSet) {
        //     // map.stopLocate();
        //     map.locate({
        //         watch: true,
        //         setView: false,
        //         enableHighAccuracy: true
        //     });
        //     viewSet = true;
        // }
    });

    function reset(){
        var mapEl = document.getElementById('map');
        document.body.style.width = mapEl.offsetWidth + 'px';
    }

    function locate(){
        map.locate({
            watch: true,
            setView: true,
            enableHighAccuracy: true
        });
    }

    function onDeviceReady(){
        fetchTrails(function (err, geojson) {
            trails = geojson;
            renderTrailsList(trails.features);
        });

        locate();
        reset();
    }

    function onPause(){
        map.stopLocate();
        viewSet = false;
    }

    function onResume(){
        locate();
    }

    onDeviceReady();

    document.addEventListener("deviceready", onDeviceReady, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);

    return {
        toggleMenu: toggleMenu,
        toggleSubMenu: toggleSubMenu,
        back: back,
        showTrail: showTrail
    }

}

var app;
function init(){
    app = app(window, document, L);
}