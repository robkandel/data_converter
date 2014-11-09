var parse_csv_json = (function() {
	var _processed_data;
	var method = {
		init: function(a,b) {
			var _regx = new RegExp("[^,]", "gi");
    		var _num_commas = a.replace(_regx, "").length;
		    _regx = new RegExp("[^\t]", "gi");
		    var _num_tabs = a.replace(_regx, "").length;
		    var _row_delimiter = "\n";
		    var _delimiter = ",";
		    if (_num_tabs > _num_commas) {
				_delimiter = "\t"
    		};
    		_regx = new RegExp("^" + _row_delimiter + "+", "gi");
    		a = a.replace(_regx, "");
    		_regx = new RegExp(_row_delimiter + "+$", "gi");
    		a = a.replace(_regx, "");
    		return method.parse_csv(a, ",", b);
		},
		
		parse_csv: function(a,b,c) {
			var _pattern = new RegExp(("(\\" + b + "|\\r?\\n|\\r|^)" +"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +"([^\"\\" + b + "\\r\\n]*))"),"gi");
        	var _data_list = [[]];
        	var _matches = null;
        	while (_matches = _pattern.exec(a)){
        		var _match_delimiter = _matches[1];
        		if (_match_delimiter.length && _match_delimiter != b){
        			 _data_list.push([]);
        		}
        		if (_matches[2]){
          			var _matched_value = _matches[2].replace(new RegExp( "\"\"", "g" ),"\"");
				} else {
 			         var _matched_value = _matches[3];
        		}
        		_data_list[_data_list.length - 1].push(_matched_value);
        	}
        	return method.remove_line_breaks(_data_list, c)
		}, 
		
		remove_line_breaks: function(a,b) {
			var _lat = -1;
			var _lng = -1
			for (var i = 0; i < a.length; i++){
      			for (var d = 0; d < a[i].length; d++){
        			a[i][d] = a[i][d].replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, " ");
        			if (i == 0) {
        				if(a[i][d].toLowerCase() == 'latitude' || a[i][d].toLowerCase() == 'lat' || a[i][d].toLowerCase() == 'lat.') {
        					_lat = d
        				}
        				if(a[i][d].toLowerCase() == 'longitude' || a[i][d].toLowerCase() == 'lon' || a[i][d].toLowerCase() == 'lng' || a[i][d].toLowerCase() == 'lon.' || a[i][d].toLowerCase() == 'lng.' || a[i][d].toLowerCase() == 'long' || a[i][d].toLowerCase() == 'long.') {
        					_lng = d
        				}
        			}
      			}
    		}
    		if (_lat != -1 && _lng !=-1) {
    			jQuery("li[data-role='option_4']").removeClass('optionButtonNotActive');
    			jQuery("li[data-role='option_5']").removeClass('optionButtonNotActive');
    		} else { 
    			jQuery("li[data-role='option_4']").addClass('optionButtonNotActive');
    			jQuery("li[data-role='option_5']").addClass('optionButtonNotActive');
    		}
    		if (b == 'object') {
    			_processed_data = method.convert_to_json(a)
    		} else if(b == 'array') {
	    		_processed_data = a
	    	} else if (b == 'table') {
	    		_processed_data = method.convert_to_table(a);
	    	} else if (b == 'xml' ) {
	    		_processed_data = method.convert_to_xml(a);
	    	}  else if (b == 'kml') {
	    		_processed_data = method.convert_to_geojson(a, _lat, _lng, false);
	    	} else if (b == 'geojson') {
	    		_processed_data = method.convert_to_geojson(a, _lat, _lng, true);
	    	}
	    	return _processed_data
		},
		
		convert_to_json: function(a) {
			var _object_list = []
			for (var i = 1; i < a.length; i++) {
				var c = {}
				for (var m in a[i]) {
					c[jQuery.trim(a[0][m])] = a[i][m]
				}
				_object_list.push(c)
			}
			return _object_list
		},
		
		convert_to_table: function(a) {
			var _table = '<table class="dataConverterTable">\n\t<thead>';
			for (var i = 0; i < a.length; i++) {	
				if (i == 1) {
					_table += '\n\t</thead>\n\t<tbody>';
				}
				if (i != 0) {
					if (i % 2) {
						_table +='\n\t\t<tr class="rowEven rowIndex'+i+'">';
					} else {
						_table +='\n\t\t<tr class="rowOdd rowIndex'+i+'">';
					}
				} else {
					_table +='\n\t\t<tr>';
				}
				for (var d = 0; d < a[i].length; d++) {
					_table +='\n\t\t\t<td class="cellIndex'+d+'">'+a[i][d]+'</td>';
				}
				_table +='\n\t\t</tr>';
			}
			_table += '\n\t</tbody>\n</table>';
			jQuery('#table_converter').html(_table);
			return _table;
		}, 
		
		convert_to_xml: function(a) {
			var _xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rows>';
			for (var i = 1; i < a.length; i++) {	
				_xml +='\n\t<row>';
				for (var d = 0; d < a[i].length; d++) {
					var _tag = a[0][d];
					if (_tag == '') {
						_tag = 'tag'+d
					}	
					_xml +='\n\t\t<'+jQuery.trim(_tag.replace(/ /g, '_').replace(/\W+/g, ""))+'>'+a[i][d]+'</'+jQuery.trim(_tag.replace(/ /g, '_').replace(/\W+/g, ""))+'>';
				}
				_xml +='\n\t</row>';
			}
			_xml += '\n</rows>';
			jQuery('#table_converter').html(_xml);
			return _xml;
		},
		
		convert_to_geojson: function(a, b, c, e) {
			var _kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>';
			for (var i = 1; i < a.length; i++) {	
				_kml +='<Placemark>';
				_kml += '<Point><coordinates>'+a[i][parseFloat(c)]+','+a[i][parseFloat(b)]+',0</coordinates></Point>'
				for (var d = 0; d < a[i].length; d++) {
					var _tag = a[0][d];
					if (_tag == '') {
						_tag = 'tag'+d
					}
					if (d == 0) {
						_kml +='<ExtendedData>';
					}
					if (d != parseFloat(b) && d != parseFloat(c)) {
						_kml +='<'+jQuery.trim(_tag.replace(/ /g, '_').replace(/\W+/g, ""))+'>'+a[i][d].replace(/&/g, '&amp;').replace(/</g, 'lt;').replace(/>/g, 'gt;')+'</'+jQuery.trim(_tag.replace(/ /g, '_').replace(/\W+/g, ""))+'>';
					}
					if (d == a[i].length-1) {
						_kml +='</ExtendedData>';
					}
				}
				_kml +='</Placemark>';
			}
			_kml += '</Document></kml>';
			if(e) {
				return toGeoJSON.kml(jQuery.parseXML(_kml));
			} else {
				return jQuery('#table_converter').html(_kml);
			}
		}
		
	};
	return method;
})();