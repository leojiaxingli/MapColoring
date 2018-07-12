var map;
var polyPath;
function initMap() {
  var plainStyle = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ];
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: { lat: 43.660165, lng: -79.394515 },
    gestureHandling: 'cooperative',
    disableDefaultUI: true,
    zoomControl: true,
    styles: plainStyle
  });
  var geocoder = new google.maps.Geocoder();
  var infowindow = new google.maps.InfoWindow({
    content: "infowindow content was not initialized",
    maxWidth: 200
  });

  document.getElementById('submit').addEventListener('click', function() {
    geocodeAddress(geocoder, infowindow, map);
  });

  document.getElementById('address').addEventListener('keypress', function(e) {
    var key = e.which || e.keyCode;
    if (key === 13) {
      geocodeAddress(geocoder, infowindow, map);
    }
  });

  // TODO: outputs undefined
  /* document.getElementById('PCI-predict-year').addEventListener('click', function(){
    slider_change();
  }); */
  polyPath = new google.maps.Polyline({
      strokeColor: '#000000',
      strokeOpacity: 1.0,
      strokeWeight: 2
  });
}

function setPoly(poly,color){
	polyPath.setMap(null);
    polyPath = new google.maps.Polyline({
        path: poly, geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    polyPath.setMap(map);
}

function geocodeAddress(geocoder, infowindow, resultsMap) {
  var address = document.getElementById('address').value;
  var color='#000000';
  geocoder.geocode({
      'address': address,
      'region': 'CA'
  }, function(results, status) {
    if (status === 'OK') {
      var matchedIndex = -1;
      for (var i = 0; i < results.length; i++) {
        for (var j = 0; j < results[i].types.length; j++) {
          // if result at index i is a road, update matchedIndex and exit
          if (results[i].types[j] === 'route') {
            matchedIndex = i;
            break;
          }
        }
        // if matchedIndex has already been updated, exit
        if (matchedIndex !== -1)
          break;
      }
      // if a road has been found, display infowindow
      if (matchedIndex !== -1){
        var contentString;
        if (check_inputs_valid()) {
          var pciResult = Foo (
            document.getElementById('PCI0').value,
            document.getElementById('AADT').value,
            document.getElementById('AGE').value,
            document.getElementById('FREEZE_INDEX_YR').value,
            document.getElementById('FREEZE_THAW_YR').value,
            findGBE("GBE_TYPE","GBE_THICK"),
            DecodeType(document.getElementById('PAVEMENT_TYPE').value,pav_type_parsed),
            document.getElementById('MAX_ANN_TEMP_AVG').value,
            document.getElementById('REMED_YEARS').value,
            document.getElementById('TOTAL_ANN_PRECIP').value
          );
          contentString = 'Future PCI: <b><span style=';
          if (pciResult.indexOf("Good") !== -1) {
            contentString += '\"color:#00b050;\"';
            color = '#00b050';
          } else if (pciResult.indexOf("Satisfactory") !== -1) {
            contentString += '\"color:#92d050;\"';
            color = '#92d050';
          } else if (pciResult.indexOf("Fair") !== -1) {
            contentString += '\"color:#ffd70f;\"';
            color = '#ffd70f';
          } else if (pciResult.indexOf("Very Poor") !== -1) {
            // check for Very Poor before Poor as "Very Poor" contains "Poor"
            contentString += '\"color:#c00000;\"';
            color = '#c00000';
          } else if (pciResult.indexOf("Poor") !== -1) {
            contentString += '\"color:#ff0000;\"';
            color = '#ff0000';
          } else if (pciResult.indexOf("Serious") !== -1) {
            contentString += '\"color:#843c0c;\"';
            color = '#843c0c';
          } else if (pciResult.indexOf("Failed") !== -1) {
            contentString += '\"color:#8497b0;\"';
            color = '#8497b0';
          } else {
            contentString += '\"color:#000000;\"';
            color = '#000000';
          }
          contentString += '>' + pciResult + '</span></b>';
          drawLine(address,color);
        } else {
          drawLine(address,color);
          contentString = '<b><span style=\"color#8497b0;\">Unknown.</span></b> Please input data in Input Fields';
        }

        resultsMap.fitBounds(results[matchedIndex].geometry.viewport);
        infowindow.setPosition(results[matchedIndex].geometry.location);
        infowindow.setContent(contentString);
        infowindow.open(resultsMap);
      } else {
        alert('Road not found.');
      }
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}
function drawLine(address,color){
	$.ajax({
        type : "POST",
        url : 'streetData',
        data : {name:address},
        dataType : 'json',
        async: true,
        success : function(data){
            setPoly(data,color);
        }
    });
    
}

function check_inputs_valid(){
  if (
    document.getElementById('PCI0').value == 0 &&
    document.getElementById('AADT').value == 0 &&
    document.getElementById('AGE').value == 0 &&
    document.getElementById('FREEZE_INDEX_YR').value == 0 &&
    document.getElementById('FREEZE_THAW_YR').value == 0 &&
    findGBE("GBE_TYPE","GBE_THICK") == 0 &&
    document.getElementById('PAVEMENT_TYPE').value == 'JRCP - Placed Directly on Untreated Subgrade' &&
    document.getElementById('MAX_ANN_TEMP_AVG').value == 0 &&
    document.getElementById('REMED_YEARS').value == 0 &&
    document.getElementById('TOTAL_ANN_PRECIP').value == 0
  ) return 0;
  else return 1;
}

function slider_change(){
  var slider = document.getElementById("PCI-predict-year");
  var output = document.getElementById("PCI-years");
  output.innerHTML = slider.value;
  output.innerHTML = this.value;
}

function addGBE(divName){
  var newbr = document.createElement("br");
  var newdiv = document.createElement('div');
  newdiv.className = "row";
  newdiv.innerHTML = "<div class=\"col-xs-6\">" +
    "<select id=\"GBE_TYPE\" class=\"form-control GBE_TYPE\" onchange=\"gbe_change();\">" +
    "<option>Granular Base</option>" +
    "<option>Granular (Unbound) Subbase</option>" +
    "<option>Treated (Bound) Base</option>" +
    "<option>Treated (Bound) Subbase</option>" +
    "<option>Subgrade (Untreated)</option>" +
    "<option>Portland Cement Concrete</option>" +
    "option>Engineering Fabric</option>" +
    "<option>Asphalt Concrete</option></select></div>" +
    "<div class=\"col-xs-6\">" +
    "<input class=\"form-control GBE_THICK\" type=\"number\"" +
    "id=\"GBE_THICK\" placeholder=\"0\" onchange=\"gbe_change();\"></input></div>";
  document.getElementById(divName).appendChild(newbr);
  document.getElementById(divName).appendChild(newdiv);
}

function findGBE(type_class, thick_class){
  var gbe = 0;
  var types = document.getElementsByClassName(type_class);
  var thicks = document.getElementsByClassName(thick_class);
  for (var i = 0; i < types.length; i++) {
    gbe += DecodeType(types[i].value,gbe_type_parsed)*thicks[i].value;
  }
  console.log(gbe);
  return gbe;
}

function gbe_click(){
  addGBE('GBE-dynamic-block');
  var gbe_total = findGBE('GBE_TYPE','GBE_THICK');
  document.getElementById('gbe_result-text').innerHTML = parseFloat(gbe_total).toFixed(2);
}

function gbe_change(){
  var gbe_total = findGBE('GBE_TYPE','GBE_THICK');
  document.getElementById('gbe_result-text').innerHTML = parseFloat(gbe_total).toFixed(2);
}

function DecodeType(sel_val, code_array){
  var decoded_val;
  for (var i = 0; i < code_array.length; i++) {
    if(code_array[i][1] == sel_val){
      console.log(code_array[i][1]);
      decoded_val = code_array[i][0];
    }
  }
  return decoded_val;
}

function CSVToArray( strData, strDelimiter ){
     // Check to see if the delimiter is defined. If not,
     // then default to comma.
     strDelimiter = (strDelimiter || ",");

     // Create a regular expression to parse the CSV values.
     var objPattern = new RegExp(
         (
             // Delimiters.
             "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

             // Quoted fields.
             "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

             // Standard fields.
             "([^\"\\" + strDelimiter + "\\r\\n]*))"
         ),
         "gi"
         );


     // Create an array to hold our data. Give the array
     // a default empty first row.
     var arrData = [[]];

     // Create an array to hold our individual pattern
     // matching groups.
     var arrMatches = null;


     // Keep looping over the regular expression matches
     // until we can no longer find a match.
     while (arrMatches = objPattern.exec( strData )){

         // Get the delimiter that was found.
         var strMatchedDelimiter = arrMatches[ 1 ];

         // Check to see if the given delimiter has a length
         // (is not the start of string) and if it matches
         // field delimiter. If id does not, then we know
         // that this delimiter is a row delimiter.
         if (
             strMatchedDelimiter.length &&
             strMatchedDelimiter !== strDelimiter
             ){

             // Since we have reached a new row of data,
             // add an empty row to our data array.
             arrData.push( [] );

         }

         var strMatchedValue;

         // Now that we have our delimiter out of the way,
         // let's check to see which kind of value we
         // captured (quoted or unquoted).
         if (arrMatches[ 2 ]){

             // We found a quoted value. When we capture
             // this value, unescape any double quotes.
             strMatchedValue = arrMatches[ 2 ].replace(
                 new RegExp( "\"\"", "g" ),
                 "\""
                 );

         } else {

             // We found a non-quoted value.
             strMatchedValue = arrMatches[ 3 ];

         }


         // Now that we have our value string, let's add
         // it to the data array.
         arrData[ arrData.length - 1 ].push( strMatchedValue );
     }

     // Return the parsed data.
     return( arrData );
 }

//preprocessing
var gbe_type_cfg =  "1,Granular Base\n" +
                    "0.67,Granular (Unbound) Subbase\n" +
                    "1.7,Treated (Bound) Base\n" +
                    "0.67,Treated (Bound) Subbase\n" +
                    "0.67,Subgrade (Untreated)\n" +
                    "1.33,Portland Cement Concrete\n" +
                    "1.67,Engineering Fabric\n" +
                    "2,Asphalt Concrete";

var gbe_type_parsed = CSVToArray(gbe_type_cfg, ",");

var pav_type_cfg =  "12,JRCP - Placed Directly on Untreated Subgrade\n" +
                    "13,CRCP - Placed Directly on Untreated Subgrade\n" +
                    "14,JPCP - Placed Directly on Treated Subgrade\n" +
                    "15,JRCP - Placed Directly on Treated Subgrade\n" +
                    "16,CRCP - Placed Directly on Treated Subgrade\n" +
                    "1,AC with Granular Base\n" +
                    "2,AC with Bituminous Treated Base\n" +
                    "3,AC Overlay on AC Pavement\n" +
                    "4,JPCP Overlay on AC Pavement\n" +
                    "5,JRCP Overlay on AC Pavement\n" +
                    "6,CRCP Overlay on AC Pavement\n" +
                    "7,AC with Non-Bituminous Treated Base\n" +
                    "10,Other\n" +
                    "11,JPCP - Placed Directly on Untreated Subgrade\n" +
                    "35,JPCP Overlay on CRCP Pavement\n" +
                    "36,JRCP Overlay on CRCP Pavement\n" +
                    "37,CRCP Overlay on CRCP Pavement\n" +
                    "38,CRCP Overlay on JPCP Pavement\n" +
                    "39,CRCP Overlay on JRCP Pavement\n" +
                    "40,Prestressed Concrete Pavement\n" +
                    "51,JPCP with Asphalt Concrete Wearing Surface\n" +
                    "52,JRCP with Asphalt Concrete Wearing Surface\n" +
                    "53,CRCP with Asphalt Concrete Wearing Surface\n" +
                    "17,JPCP - Over Unbound Base\n" +
                    "18,JRCP - Over Unbound Base\n" +
                    "19,CRCP - Over Unbound Base\n" +
                    "20,JPCP Over Bituminous Treated Base\n" +
                    "21,JRCP Over Bituminous Treated Base\n" +
                    "22,CRCP Over Bituminous Treated Base\n" +
                    "23,JPCP Over Non-Bituminous Treated Base\n" +
                    "24,JRCP Over Non-Bituminous Treated Base\n" +
                    "25,CRCP Over Non-Bituminous Treated Base\n" +
                    "28,AC Overlay on JPCP Pavement\n" +
                    "29,AC Overlay on JRCP Pavement\n" +
                    "30,AC Overlay on CRCP Pavement\n" +
                    "31,JPCP Overlay on JPCP Pavement\n" +
                    "32,JRCP Overlay on JPCP Pavement\n" +
                    "33,JPCP Overlay on JRCP Pavement\n" +
                    "34,JRCP Overlay on JRCP Pavement";

var pav_type_parsed = CSVToArray(pav_type_cfg, ",");

function Foo(PCI0,AADT,AGE,FREEZE_INDEX_YR,FREEZE_THAW_YR,GBE,PAVEMENT_TYPE,MAX_ANN_TEMP_AVG,REMED_YEARS,TOTAL_ANN_PRECIP){

    if(PCI0 <= 85.2){
        if(PCI0 <= 64.6){
            if(PCI0 <= 46.4){
                if(AADT <= 4290){
                    if(AGE <= 26.61){
                        console.log("Poor (83%)");
                        return "Poor (83%)";
                    }
                    if(AGE > 26.61){
                        console.log("Very Poor (100%)");
                        return "Very Poor (100%)";
                    }
                }
                if(AADT > 4290){
                    console.log("Very Poor (100%)");
                    return "Very Poor (100%)";
                }
            }
            if(PCI0 > 46.4){
                if(GBE <= 58.672){
                    if(PAVEMENT_TYPE <= 23){
                        if(AGE <= 40.02){
                            if(GBE <= 47.204){
                                if(GBE <= 28.1){
                                    console.log("Poor (86%)");
                                    return "Poor (86%)";
                                }
                                if(GBE > 28.1){
                                    if(AADT <= 14900){
                                        if(FREEZE_THAW_YR <= 111){
                                            if(PCI0 <= 55){
                                                console.log("Very Poor (88%)");
                                                return "Very Poor (88%)";
                                            }
                                            if(PCI0 > 55){
                                                console.log("Poor (100%)");
                                                return "Poor (100%)";
                                            }
                                        }
                                        if(FREEZE_THAW_YR > 111){
                                            if(MAX_ANN_TEMP_AVG <= 13){
                                                console.log("Very Poor (100%)");
                                                return "Very Poor (100%)";
                                            }
                                            if(MAX_ANN_TEMP_AVG > 13){
                                                if(TOTAL_ANN_PRECIP <= 272){
                                                    console.log("Poor (88%)");
                                                    return "Poor (88%)";
                                                }
                                                if(TOTAL_ANN_PRECIP > 272){
                                                    console.log("Fair (100%)");
                                                    return "Fair (100%)";
                                                }
                                            }
                                        }
                                    }
                                    if(AADT > 14900){
                                        console.log("Very Poor (100%)");
                                        return "Very Poor (100%)";
                                    }
                                }
                            }
                            if(GBE > 47.204){
                                if(AADT <= 19400){
                                    console.log("Poor (100%)");
                                    return "Poor (100%)";
                                }
                                if(AADT > 19400){
                                    console.log("Satisfactory (100%)");
                                    return "Satisfactory (100%)";
                                }
                            }
                        }
                        if(AGE > 40.02){
                            console.log("Very Poor (90%)");
                            return "Very Poor (90%)";
                        }
                    }
                    if(PAVEMENT_TYPE > 23){
                        if(FREEZE_THAW_YR <= 76){
                            console.log("Fair (100%)");
                            return "Fair (100%)";
                        }
                        if(FREEZE_THAW_YR > 76){
                            console.log("Very Poor (100%)");
                            return "Very Poor (100%)";
                        }
                    }
                }
                if(GBE > 58.672){
                    if(TOTAL_ANN_PRECIP <= 876.6){
                        console.log("Fair (100%)");
                        return "Fair (100%)";
                    }
                    if(TOTAL_ANN_PRECIP > 876.6){
                        console.log("Very Poor (82%)");
                        return "Very Poor (82%)";
                    }
                }
            }
        }
        if(PCI0 > 64.6){
            if(AGE <= 40.96){
                if(PCI0 <= 70.6){
                    if(TOTAL_ANN_PRECIP <= 229.4){
                        if(PCI0 <= 68.2){
                            console.log("Very Poor (100%)");
                            return "Very Poor (100%)";
                        }
                        if(PCI0 > 68.2){
                            console.log("Fair (100%)");
                            return "Fair (100%)";
                        }
                    }
                    if(TOTAL_ANN_PRECIP > 229.4){
                        if(AADT <= 6101){
                            if(TOTAL_ANN_PRECIP <= 957.7){
                                console.log("Fair (96%)");
                                return "Fair (96%)";
                            }
                            if(TOTAL_ANN_PRECIP > 957.7){
                                console.log("Very Poor (100%)");
                                return "Very Poor (100%)";
                            }
                        }
                        if(AADT > 6101){
                            if(GBE <= 77.78){
                                if(PCI0 <= 69){
                                    console.log("Fair (95%)");
                                    return "Fair (95%)";
                                }
                                if(PCI0 > 69){
                                    if(REMED_YEARS <= 7.7){
                                        console.log("Poor (100%)");
                                        return "Poor (100%)";
                                    }
                                    if(REMED_YEARS > 7.7){
                                        console.log("Fair (100%)");
                                        return "Fair (100%)";
                                    }
                                }
                            }
                            if(GBE > 77.78){
                                console.log("Poor (100%)");
                                return "Poor (100%)";
                            }
                        }
                    }
                }
                if(PCI0 > 70.6){
                    if(MAX_ANN_TEMP_AVG <= 28.3){
                        if(GBE <= 38.24){
                            if(REMED_YEARS <= 11){
                                if(FREEZE_THAW_YR <= 19){
                                    console.log("Satisfactory (93%)");
                                    return "Satisfactory (93%)";
                                }
                                if(FREEZE_THAW_YR > 19){
                                    if(MAX_ANN_TEMP_AVG <= 14.6){
                                        console.log("Poor (67%)");
                                        return "Poor (67%)";
                                    }
                                    if(MAX_ANN_TEMP_AVG > 14.6){
                                        if(AADT <= 23600){
                                            if(AADT <= 8000){
                                                if(AGE <= 10.98){
                                                    console.log("Fair (80%)");
                                                    return "Fair (80%)";
                                                }
                                                if(AGE > 10.98){
                                                    if(FREEZE_INDEX_YR <= 55){
                                                        console.log("Satisfactory (100%)");
                                                        return "Satisfactory (100%)";
                                                    }
                                                    if(FREEZE_INDEX_YR > 55){
                                                        if(MAX_ANN_TEMP_AVG <= 18.9){
                                                            if(GBE <= 31.52){
                                                                console.log("Satisfactory (100%)");
                                                                return "Satisfactory (100%)";
                                                            }
                                                            if(GBE > 31.52){
                                                                console.log("Fair (75%)");
                                                                return "Fair (75%)";
                                                            }
                                                        }
                                                        if(MAX_ANN_TEMP_AVG > 18.9){
                                                            console.log("Fair (100%)");
                                                            return "Fair (100%)";
                                                        }
                                                    }
                                                }
                                            }
                                            if(AADT > 8000){
                                                console.log("Fair (95%)");
                                                return "Fair (95%)";
                                            }
                                        }
                                        if(AADT > 23600){
                                            if(AADT <= 30000){
                                                console.log("Satisfactory (100%)");
                                                return "Satisfactory (100%)";
                                            }
                                            if(AADT > 30000){
                                                console.log("Very Poor (75%)");
                                                return "Very Poor (75%)";
                                            }
                                        }
                                    }
                                }
                            }
                            if(REMED_YEARS > 11){
                                if(REMED_YEARS <= 12){
                                    console.log("Poor (100%)");
                                    return "Poor (100%)";
                                }
                                if(REMED_YEARS > 12){
                                    console.log("Fair (88%)");
                                    return "Fair (88%)";
                                }
                            }
                        }
                        if(GBE > 38.24){
                            if(PCI0 <= 73.3){
                                console.log("Very Poor (100%)");
                                return "Very Poor (100%)";
                            }
                            if(PCI0 > 73.3){
                                if(FREEZE_INDEX_YR <= 641){
                                    if(AGE <= 19.24){
                                        console.log("Very Poor (67%)");
                                        return "Very Poor (67%)";
                                    }
                                    if(AGE > 19.24){
                                        console.log("Satisfactory (100%)");
                                        return "Satisfactory (100%)";
                                    }
                                }
                                if(FREEZE_INDEX_YR > 641){
                                    console.log("Fair (100%)");
                                    return "Fair (100%)";
                                }
                            }
                        }
                    }
                    if(MAX_ANN_TEMP_AVG > 28.3){
                        console.log("Fair (97%)");
                        return "Fair (97%)";
                    }
                }
            }
            if(AGE > 40.96){
                if(PCI0 <= 84.2){
                    console.log("Satisfactory (100%)");
                    return "Satisfactory (100%)";
                }
                if(PCI0 > 84.2){
                    console.log("Very Poor (100%)");
                    return "Very Poor (100%)";
                }
            }
        }
    }
    if(PCI0 > 85.2){
        if(TOTAL_ANN_PRECIP <= 322){
            if(AADT <= 23600){
                if(PCI0 <= 93.5){
                    if(GBE <= 12.3){
                        console.log("Good (86%)");
                        return "Good (86%)";
                    }
                    if(GBE > 12.3){
                        console.log("Satisfactory (100%)");
                        return "Satisfactory (100%)";
                    }
                }
                if(PCI0 > 93.5){
                    console.log("Good (100%)");
                    return "Good (100%)";
                }
            }
            if(AADT > 23600){
                if(AGE <= 27.15){
                    console.log("Very Poor (100%)");
                    return "Very Poor (100%)";
                }
                if(AGE > 27.15){
                    console.log("Satisfactory (100%)");
                    return "Satisfactory (100%)";
                }
            }
        }
        if(TOTAL_ANN_PRECIP > 322){
            if(PCI0 <= 97.4){
                if(TOTAL_ANN_PRECIP <= 1630.8){
                    if(MAX_ANN_TEMP_AVG <= 15.2){
                        if(AGE <= 23.91){
                            if(PCI0 <= 91.6){
                                if(REMED_YEARS <= 1){
                                    console.log("Good (83%)");
                                    return "Good (83%)";
                                }
                                if(REMED_YEARS > 1){
                                    if(REMED_YEARS <= 3.6){
                                        console.log("Fair (75%)");
                                        return "Fair (75%)";
                                    }
                                    if(REMED_YEARS > 3.6){
                                        console.log("Satisfactory (100%)");
                                        return "Satisfactory (100%)";
                                    }
                                }
                            }
                            if(PCI0 > 91.6){
                                if(FREEZE_INDEX_YR <= 845){
                                    console.log("Very Poor (67%)");
                                    return "Very Poor (67%)";
                                }
                                if(FREEZE_INDEX_YR > 845){
                                    console.log("Fair (100%)");
                                    return "Fair (100%)";
                                }
                            }
                        }
                        if(AGE > 23.91){
                            if(PCI0 <= 91.6){
                                console.log("Fair (100%)");
                                return "Fair (100%)";
                            }
                            if(PCI0 > 91.6){
                                if(PCI0 <= 92.3){
                                    console.log("Poor (100%)");
                                    return "Poor (100%)";
                                }
                                if(PCI0 > 92.3){
                                    console.log("Fair (67%)");
                                    return "Fair (67%)";
                                }
                            }
                        }
                    }
                    if(MAX_ANN_TEMP_AVG > 15.2){
                        if(FREEZE_THAW_YR <= 11){
                            console.log("Good (100%)");
                            return "Good (100%)";
                        }
                        if(FREEZE_THAW_YR > 11){
                            console.log("Satisfactory (87%)");
                            return "Satisfactory (87%)";
                        }
                    }
                }
                if(TOTAL_ANN_PRECIP > 1630.8){
                    console.log("Good (90%)");
                    return "Good (90%)";
                }
            }
            if(PCI0 > 97.4){
                if(AGE <= 11.32){
                    if(AGE <= 9.2){
                        console.log("Satisfactory (75%)");
                        return "Satisfactory (75%)";
                    }
                    if(AGE > 9.2){
                        console.log("Poor (100%)");
                        return "Poor (100%)";
                    }
                }
                if(AGE > 11.32){
                    if(AADT <= 18600){
                        if(AADT <= 7950){
                            if(FREEZE_THAW_YR <= 86){
                                console.log("Good (94%)");
                                return "Good (94%)";
                            }
                            if(FREEZE_THAW_YR > 86){
                                if(FREEZE_THAW_YR <= 109){
                                    if(AGE <= 38.8){
                                        console.log("Fair (100%)");
                                        return "Fair (100%)";
                                    }
                                    if(AGE > 38.8){
                                        console.log("Good (100%)");
                                        return "Good (100%)";
                                    }
                                }
                                if(FREEZE_THAW_YR > 109){
                                    console.log("Good (100%)");
                                    return "Good (100%)";
                                }
                            }
                        }
                        if(AADT > 7950){
                            if(REMED_YEARS <= 0.1){
                                if(TOTAL_ANN_PRECIP <= 791){
                                    console.log("Good (100%)");
                                    return "Good (100%)";
                                }
                                if(TOTAL_ANN_PRECIP > 791){
                                    console.log("Satisfactory (88%)");
                                    return "Satisfactory (88%)";
                                }
                            }
                            if(REMED_YEARS > 0.1){
                                if(GBE <= 25.997){
                                    console.log("Satisfactory (95%)");
                                    return "Satisfactory (95%)";
                                }
                                if(GBE > 25.997){
                                    console.log("Good (95%)");
                                    return "Good (95%)";
                                }
                            }
                        }
                    }
                    if(AADT > 18600){
                        if(AGE <= 36.04){
                            if(AGE <= 17.86){
                                if(REMED_YEARS <= 0.4){
                                    console.log("Fair (100%)");
                                    return "Fair (100%)";
                                }
                                if(REMED_YEARS > 0.4){
                                    console.log("Satisfactory (67%)");
                                    return "Satisfactory (67%)";
                                }
                            }
                            if(AGE > 17.86){
                                if(AADT <= 26450){
                                    console.log("Satisfactory (89%)");
                                    return "Satisfactory (89%)";
                                }
                                if(AADT > 26450){
                                    if(TOTAL_ANN_PRECIP <= 1177.5){
                                        if(AGE <= 27.63){
                                            console.log("Satisfactory (100%)");
                                            return "Satisfactory (100%)";
                                        }
                                        if(AGE > 27.63){
                                            console.log("Good (100%)");
                                            return "Good (100%)";
                                        }
                                    }
                                    if(TOTAL_ANN_PRECIP > 1177.5){
                                        console.log("Good (100%)");
                                        return "Good (100%)";
                                    }
                                }
                            }
                        }
                        if(AGE > 36.04){
                            console.log("Fair (86%)");
                            return "Fair (86%)";
                        }
                    }
                }
            }
        }
    }

    return "";
}
