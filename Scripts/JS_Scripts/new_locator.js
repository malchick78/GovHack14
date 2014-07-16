google.load('visualization', '1', {'packages':['corechart', 'table', 'geomap']});

//varibles
var mlTableId = '1-Y70mF2pN9a7Jd_iOzWfnVo5jEFAVKgGgNbwx9I';
var map;
var geocoder;
var infoWindow;
var marker;
var layer;
var mlData = [];
var popData = [];
var uniqueNames = [];
var chart;
var stateArr=['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
/*ML list varible*/
var currentPopulation;
var currentLocation;
var currentState;

$(document).ready(function(){	
	/*=========== Create page structure =============*/
	if($('#mainContent')){
		$('#mainContent').prepend('<div id="map_canvas"></div>');
	}
	
//	$('#map_canvas').before('<div id="ml-display"><div id="ml-info"></div></div>');
	
	
	
	
	
	
	/*=========== End create page structure =============*/
	
	/*=========== Google map scripts =============*/
	
      
      function initialize() {
		geocoder = new google.maps.Geocoder();
		infoWindow = new google.maps.InfoWindow({disableAutoPan: true});
		marker = new google.maps.Marker({
		 map: map,
		  visible: false
		});
        var mapOptions = {
			scaleControl: true,
			zoom: 5, 
			minZoom: 5,	
			maxZoom: 18,
			streetViewControl:false,
			zoomControlOptions: {
			style: google.maps.ZoomControlStyle.LARGE,
			position: google.maps.ControlPosition.RIGHT_TOP
			},
			panControlOptions: {
  			position: google.maps.ControlPosition.RIGHT_TOP
			},
       		center: new google.maps.LatLng(-26.902477,127.96875),
        	mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
		
		initLayer();
		getMlList();
      }

      google.maps.event.addDomListener(window, 'load', initialize); 
	  
	  //google.load('visualization', '1.1', { 'packages':['corechart']});
	  //End initialize

	/*=========== End Google map scripts =============*/
	
	
});//End document.ready

function createQuery(selectCols, whereClause){
	var query = "SELECT "+selectCols+" FROM " + mlTableId;
	
	if(whereClause!==undefined){
		query +=" WHERE "+whereClause;
	}
	
	var encodedQuery = encodeURIComponent(query);
				
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
	url.push('?sql=' + encodedQuery);
	url.push('&key=AIzaSyDeh2v2Itm_a7iIL0XxDHaw9zeIaEwYCZo');
	url.push('&callback=?');
	
	return url;
}


function clearSearchField(event) {
	if(($("#ml-search-box").val() == "Enter address")&& (event.type=="click") ){
     	$("#ml-search-box").val("");
 	}
	
	if(($("#ml-search-box").val() == "") && (event.type=="blur")) {
     	$("#ml-search-box").val("Enter address");
 	}
	
	if(event.type=="keypress"){
		var code = event.which;
		if(code==13){
			$('#ml-submit').trigger('click');
		}
	}
}

function initLayer(){
       layer = new google.maps.FusionTablesLayer({
          query: {
            select: 'the_geom',
            from: mlTableId 
          },
		  styles:[{
			polygonOptions: {
				fillColor: "#00baff",
				fillOpacity: 0.5
			}
		  }],
          map: map,
          suppressInfoWindows: true
        });
    	
		google.maps.event.addListener(layer, 'click', function(e){
			 var population = e.row['erp_jun09'].value;
			 var state = e.row['ml_state'].value;
			 var address = e.latLng;
			 
			 highlightRegion(population);
			 geocodeAddres(e);
		});
		
		
				
		
}

function getMlList(){
	var url = createQuery('ml_state, ml_name, erp_jun09');
				
	// Send the JSONP request using jQuery
	$.ajax({
	  url: url.join(''),
	  beforeSend: function() {
    	$('body').prepend('<div class="loading">Loading...</div>');
	  },
	  dataType: 'jsonp',
	  success: function (data) {
		$('#sliderbox').hide();  
		var rows = data['rows'];
		for (var i in rows){
		  var stateName = rows[i][1]+', '+rows[i][0];
		  var population = rows[i][2];
		  mlData.push(stateName);
		  popData.push(population);
		}
		
		if($('.loading')){
			$('.loading').fadeOut('fast', function(){$('.loading').remove()});
		}
		
		 //add left panel to the map
		var sliderBoxDiv = document.createElement('div');
		var sliderBoxControl  = new SliderBoxControl(sliderBoxDiv, map);
	
		sliderBoxDiv.index = 0;
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(sliderBoxDiv);
		
		
		$('#sliderbox').append('<h2>Search the Map</h2><div id="ml-search"><input id="ml-search-box" value="Enter address" type="text" onClick="clearSearchField(event)" onBlur="clearSearchField(event)" onKeyPress="clearSearchField(event)"><input id="ml-submit" type="submit" value="Find"></div><div id="ml-stats"><a href="/internet/medicarelocals/publishing.nsf/Content/medicarelocalstats">Access Statistics and Data</a></div><div id="ml-help"><a href="/internet/medicarelocals/publishing.nsf/Content/ML-Map-Help">Help</a></div>');
		
		$.each(stateArr, function(i , el){
			$('#sliderbox').append('<div id="'+el+'" class="ml-state-list">'+el+'</div><div class="ml-list"><ul></ul></div>');
		});
		
		$('.ml-list').hide();
		
		$.each(mlData, function(i, el){
			if($.inArray(el, uniqueNames) === -1) {
				uniqueNames.push(el);
				var state = el.split(',');
				state[1]= state[1].replace(/\s/g, "");//remove white space
				
				$("#"+state[1]).next('.ml-list').children('ul').append('<li><a href="#" pop="'+popData[i]+'">'+state[0]+'</a></li>');
			}
		});	
		
		
		$('#sliderbox').fadeIn('slow');
		$('.ml-list li a').css({'color':'#000'});
		
		$('.ml-list li a').click(function(){
			$('body').prepend('<div class="loading">Loading...</div>');
			currentPopulation = $(this).attr('pop');
			currentLocation = $(this).text();
			currentState = $(this).parents('.ml-list').prev().text();
			//highlightRegion(currentPopulation);
			getMlRegion(currentPopulation);
		});
							
		$('.ml-state-list').click(function(){
			$('.ml-list').slideUp();
			$('.ml-state-list').removeClass('state-active');
			
			$(this).next('.ml-list').slideDown('normal',
				function(){
					$(this).prev('.ml-state-list').addClass('state-active');
				});						
		});
		
		$('#ml-submit').click(function(){
			if($('#ml-search-box').val()!==''){
				searchLoc($('#ml-search-box').val());
			}else{
				alert('Please enter an address.')
			}
		});
		
		
	  }//success
	});
}

function highlightRegion(population){
	
	layer.setOptions({
		  styles:[{
			polygonOptions: {
				fillColor: "#00baff",
				fillOpacity: 0.5
			}
			}, {
				where: "erp_jun09 = "+ population,
				polygonOptions: {
			  	fillColor: "#d84524",
				strokeColor: "#8C1A14"
			}
		  }]
        });
}


function SliderBoxControl(controlDiv, map) {

    var control = this;
    control.isOpen = true;

    var box = document.createElement('div');
    box.id = 'sliderbox';
    box.style.height = '800px';
    box.style.width = '230px';
    box.style.backgroundColor = 'white';
    controlDiv.appendChild(box);   

    var toggleBtn = document.createElement('input');
    toggleBtn.id = 'toggleBtn';
    toggleBtn.type = 'button';
    toggleBtn.value = unescape("%u25C0 Close");
    box.appendChild(toggleBtn);

    $('#toggleBtn').live('click', function() {
        if (control.isOpen) {
            $("#sliderbox").animate({
                "marginLeft": "-=210px"

            }, {
                duration: 500,
                step: function() {
                    google.maps.event.trigger(map, 'resize');
                }
            });
            control.isOpen = false;
            toggleBtn.value = unescape("%u25b6");
        } else {
            $("#sliderbox").animate({
                "marginLeft": "+=210px"
            }, {
                duration: 500,
                step: function() {
                    google.maps.event.trigger(map, 'resize');
                }
            });
            control.isOpen = true;
            toggleBtn.value = unescape("%u25C0 Close");
        };
    });
}

/*================== info window ==================*/
function geocodeAddres(clickEvent){
	var address = 'not found';
	
	geocoder.geocode( { 'location': clickEvent.latLng}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var streetAddr = null;
			var localityAddr = null;
			for (var i =0; i < results.length; i++) {
				if (results[i].types[0] == 'street_address') {
					streetAddr = results[i];
				} else if (results[i].types[0] == 'locality') {
					localityAddr = results[i];
				}
			}
			if (map.getZoom() > 11 && streetAddr) {
				address = streetAddr.formatted_address;
			} else if (localityAddr) {
				address = localityAddr.formatted_address;
			} else {
				address = results[0].formatted_address;
			}
		}
		displayInfoWindow(clickEvent.latLng, address, clickEvent.row.ml_name.value, clickEvent.row.ml_state.value);
	});
}

function displayInfoWindow(position, address, ml_name, ml_state)
{
		//var hyperlink ='<a href="http://www.medicarelocals.gov.au/internet/medicarelocals/publishing.nsf/Content/'+ml_name+'-ml">'+ml_name+' contact details</a>'
		var hyperlink ='<a href="/internet/medicarelocals/publishing.nsf/Content/'+ml_name+'-ml">'+ml_name+' contact details</a>';
	
		var tableContent=	'<table class="ml-info-window">'+
								'<tr>'+
									'<th colspan="2">Medicare Local information</strong>'+
								'</tr>';		
					tableContent +='<tr>'+
									'<td><strong>Medicare Local Name</strong></td>'+
									'<td>'+ml_name+'</td>'+
								'</tr>'+
								'<tr>'+
									'<td><strong>Contact details</strong></td>'+
									'<td>'+hyperlink+'</td>'+
								'</tr>'+
							'</table>';
							
		if (infoWindow) {
			infoWindow.close();
		}
		
		map.setCenter(position);
		marker.setPosition(position);
		infoWindow.setContent(tableContent);
		infoWindow.open(map,marker); 	
}
/*================== End info window ==================*/

//thousandSeparator function
function thousandSeparator(n,sep) {
	var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
	var sValue=n+"";
	if (sep === undefined) {sep=',';}
	while(sRegExp.test(sValue)) {
	sValue = sValue.replace(sRegExp, '$1'+sep+'$2');
	}
	return sValue;
}


function searchLoc(location) {
	location = location + " Australia"
	if (location.length > 0) {
		geocoder.geocode( { 'address': location, 'region': 'au'}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				map.setCenter(results[0].geometry.location);
				map.fitBounds(results[0].geometry.viewport);
				if (results[0].geometry.location_type == 'RANGE_INTERPOLATED') {
					map.setZoom(17);
				}
				
				var url = createQuery('ml_state, ml_name, erp_jun09', 'ST_INTERSECTS(the_geom, CIRCLE(LATLNG('+results[0].geometry.location.lat()+', '+results[0].geometry.location.lng()+'),1))');
				
				$.ajax({
				  url: url.join(''),
				  dataType: 'jsonp',
				  success: function (data) {
					var rows = data['rows'];
					displayInfoWindow(results[0].geometry.location, results[0].formatted_address, rows[0][1], rows[0][2]);	
					
					highlightRegion(rows[0][2]);				
				  }
				  
				  
				 });
			} else {
				window.alert(location + ' not found.   Status:' + status);
			}
		});
	}
}


function getMlRegion(population){
	var queryText = "SELECT the_geom, ml_state, ml_name, erp_jun09 FROM " + mlTableId + " WHERE erp_jun09 = "+population;
	var encodedQuery = encodeURIComponent(queryText);
	var query = new google.visualization.Query('http://www.google.com/fusiontables/gvizdata?tq=' + encodedQuery);
	query.send(zoomTo);
}

function zoomTo(response){
	
	if(!response){
		alert('no response');
		return;
	}
	
	if (response.isError()) {
  alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
  return;
} 
  FTresponse = response;
      
     // create a geoXml3 parser for the click handlers
     var geoXml = new geoXML3.parser({
                    map: map,
		    		zoom: false
                });
	 
	var biggestPolygon=0;
	var polygonID = 0;
		//console.log(FTresponse.getDataTable()), change the xf to whatever accordingly 

	var index=0;
	var polyKey='';
	$.each(FTresponse.getDataTable(), function(key, value){
		if(typeof FTresponse.getDataTable()[key][0] !=='undefined'){
			if(typeof FTresponse.getDataTable()[key][0].c !=='undefined'){
				polyKey=key;
			}
			
		}
		index++;
	});


	 for(i=0; i < FTresponse.getDataTable()[polyKey].length; i++){
		 
		 if(FTresponse.getDataTable()[polyKey][i].c[0].v.length>biggestPolygon){
			 biggestPolygon = FTresponse.getDataTable()[polyKey][i].c[0].v.length;
			 polygonID = i;
		 }
		 var kml =  FTresponse.getDataTable().getValue(polygonID,0);
	 }
     geoXml.parseKmlString("<Placemark>"+kml+"</Placemark>");
     geoXml.docs[0].gpolygons[0].setMap(null);
     map.fitBounds(geoXml.docs[0].gpolygons[0].bounds);
	
	displayInfoWindow(map.getCenter(), null, currentLocation, currentState);
	highlightRegion(currentPopulation);
	
	if($('.loading')){
			$('.loading').fadeOut('fast', function(){$('.loading').remove()});
	}
	//chart = new google.visualization.PieChart(document.getElementById('ml-chart'));
	//google.maps.event.addListener(infoWindow, 'domready', function() { drawChart(currentState); });
}


/*================== Chart ==================*/
function iniChart(){
	 var options = {
      width: 250,
      height: 250,
      vAxis: {title: "Statistics"},
      hAxis: {title: "Year"},
      seriesType: "bars",
      animation:{
        duration: 1000,
        easing: 'out'
      }
    };
	
	chart = new google.visualization.PieChart(document.getElementById('lm-chart'));
	
}

function drawChart(stateData) {
	var data =[];
	$('.ml-list li a').each(function(){
		var stateName = $(this).text();
		var population = parseInt($(this).attr('pop'));
		
		if(stateName.indexOf(stateData) > -1) {
			var region = stateName.split(',');
			data.push([region[0], population]);
		}
	});	
	
	var allData = google.visualization.arrayToDataTable(data);
	
	chart.draw(allData);
		
}

