// Declare Variables

// GeoJSON options
var times = ["month", "week", "day", "hour"];
var severities = ["significant", "4.5", "2.5", "1.0", "all"];

// Default options
var timePeriod = "month";
var level = "significant";
var geoData = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${level}_${timePeriod}.geojson`;
var plateData = "/Leaflet-Step-2/PB2002_boundaries.json";
var layerscontrol;
var legend;
var overlayMaps;

// Map and Legend Variables

var streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY,
    continuousWorld: false,
    noWrap: true
    });

var myMap = L.map("map", {
    center: [0,-50],
    zoom: 3,
    zoomSnap: 0.25,
    minzoom: 5,
    layers: streetmap,
});

var thresholds = [5,4,3,2,1,0];
var categories = ["5+", "4-5", "3-4", "2-3", "1-2", "<1"];
var colors = ["#ff0000", "#fc6519", "#f9b732", "#f7f74b","#c3f462","#a1f179"]

// Create Website Selections
var dropDownDays = d3.select ("#times");
var currentMap = d3.select("#current");

var currentView = currentMap.text(`Check "Earthquakes" to see earthquakes with ${level} magnitudes, over the last ${timePeriod}`);
currentMap.append("p").text("Legend may take a few seconds to load for larger queries.");

for (var i = 0; i < times.length; i++) {
  // console.log(names[i]);
  dropDownDays.append("option").attr("value", i).text(times[i]);
}

var dropDownSeverity = d3.select ("#severity");

for (var i = 0; i < severities.length; i++) {
  // console.log(names[i]);
  dropDownSeverity.append("option").attr("value", i).text(severities[i]);
}

// Updating Selections
function dayChanged(day) {
    console.log (`time changed to ${day}`);
    timePeriod = day;
    geoData = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${level}_${timePeriod}.geojson`;
    currentView = currentMap.text(`Check "Earthquakes" to see earthquakes with ${level} magnitudes, over the last ${timePeriod}`);
    console.log(geoData);
    layerscontrol.remove();
    legend.remove();
    myMap.removeLayer(overlayMaps.Earthquakes);
    dataQuery (geoData);

}

function severityChanged(severity) {
    console.log (`severity changed to ${severity}`);
    level = severity;
    geoData = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${level}_${timePeriod}.geojson`;
    currentView = currentMap.text(`Check "Earthquakes" to see earthquakes with ${level} magnitudes, over the last ${timePeriod}`);
    console.log(geoData);
    layerscontrol.remove();
    legend.remove();
    myMap.removeLayer(overlayMaps.Earthquakes);
    dataQuery (geoData);
}

function dataQuery (geoData) {
    d3.json(geoData, function(earthquakes){
        d3.json(plateData, function (plates){
            var eq = earthquakeMarkers(earthquakes);
            var plates = L.geoJSON(plates.features);
            reviseMaps(eq, plates);
        })
    });        
}

function reviseMaps(magnitudeMarker, plateMarkers){
    streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: API_KEY,
        continuousWorld: false,
        noWrap: true
        });
    
    var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: API_KEY,
        continuousWorld: false,
        noWrap: true
        });
    
        // Define a baseMaps object to hold our base layers
    var baseMaps = {
        "Street Map": streetmap,
        "Dark Map": darkmap
        };
    
        // Create overlay object to hold our overlay layer
    overlayMaps = {
        Earthquakes: magnitudeMarker,
        Plates: plateMarkers
    };
        
    myMap.layers = [streetmap, magnitudeMarker, plateMarkers];
        
    layerscontrol = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
    }).addTo(myMap);

    // Legends
    
    legend = L.control ({position: "topright"});

    legend.onAdd = function(){
        var div = L.DomUtil.create("div", "legend");
        var labels = [];
        var legendInfo = "<article><strong>Magnitude</strong><br>";
        div.innerHTML = legendInfo;

        for (var i = 0; i < categories.length; i++) {
            labels.push(
                '<section><div class="square" style="background-color:' + getColors(categories[i]) + '"></div> ' 
                + categories[i] +" </section>"
            );
        }
        div.innerHTML += labels.join('') + '</article>';        
        return div;
    };
    // Adding legend to the map
    legend.addTo(myMap);

    function getColors(value){
        if (value == categories[0]) {
            return colors[0];
        }
        else if (value == categories[1]){
            return colors[1];
        }
        else if (value == categories[2]) {
            return colors[2];
        }
        else if (value  == categories[3]){
            return colors[3];
        }
        else if ( value == categories[4]){
            return colors[4];
        }
        else {
            return colors[5];
        }
    }
}

function earthquakeMarkers(geoData){
    
    var features = geoData.features;
    function eachFeature(feature, layer) {
        var magnitude = feature.properties.mag;
        var location = feature.properties.place;
        var date = new Date(feature.properties.time);

        layer.bindPopup("<h3>Magnitude: " + magnitude + "</h3>" +
            "<hr><h4>"+ location + "</h4>" +
            "<hr><p>" + date + "</p>");

    }

    function colorMarkers(feature, latlng) {
        var magnitude = feature.properties.mag;

        var circleColor = "";
        var opacity = 1;

        if (magnitude > thresholds[0]) {
            circleColor = colors[0];
            opacity = .8;
        }
        else if (magnitude > thresholds[1]){
            circleColor = colors[1];
            opacity = .7;
        }
        else if (magnitude > thresholds[2]) {
            circleColor = colors[2];
            opacity = .7;
        }
        else if (magnitude > thresholds[3]){
            circleColor = colors[3];
            opacity = .6;
        }
        else if (magnitude > thresholds[4]){
            circleColor = colors[4];
            opacity = .6;
        }
        else {
            circleColor = colors[5];
            opacity = .5;
        }
        
        var geojsonMarkerOptions = {
            radius: magnitude*3.5,
            fillColor: circleColor,
            color: "#000",
            weight: 0,
            opacity: 1,
            fillOpacity: opacity
        };

        return L.circleMarker(latlng, geojsonMarkerOptions);
    }

    var earthquakes = L.geoJSON(features, {
        onEachFeature: eachFeature,
        pointToLayer: colorMarkers
        
    });
    
    return earthquakes;

}

dataQuery (geoData);