/*//////////////////////////////////////////////////||
// ROB KANDEL										||
// kandelrob@gmail.com								||
//													||
// created 11.06.14	| updated 11.06.14				||
// data_converter.js								||
// version 0.0.1									||
////////////////////////////////////////////////////*/

var convert_data = (function() {
	var method = {
		init: function() {
			method.reset_options();
			method.setup_buttons();
			method.setup_drag_drop();
		},
		reset_options: function() {
			jQuery('#content_input_data').val('');
			jQuery('#content_output_data').val('');
			method.setup_textareas();
		},
		setup_buttons: function() {
			jQuery('.optionWrapper').find('.optionButton').each(function() {
				if (typeof jQuery(this).attr('data-property') !== typeof undefined && jQuery(this).attr('data-property') !== false) {
					jQuery(this).on('click', function() {
						var _id = jQuery(this).attr('data-property');
						if (!jQuery(this).hasClass('optionButtonActive') && !jQuery(this).hasClass('optionButtonNotActive')) {
							jQuery('.optionButtonActive').removeClass('optionButtonActive');
							jQuery(this).addClass('optionButtonActive');
							if (jQuery('#content_input_data').val() != '') {
								method.toggle_output_type(_id);
							}
							if (jQuery('li[data-role="option_dropdown"]').hasClass('optionDropdownActive')) {
								jQuery('li[data-role="option_dropdown"]').removeClass('optionDropdownActive');
								jQuery('ul[data-role="output_wrapper"]').removeClass('outputWrapperActive');
							}
						}	
					})
				}
			});
			jQuery('li[data-role="option_dropdown"]').on('click', function() {
				if (jQuery('li[data-role="option_dropdown"]').hasClass('optionDropdownActive')) {
					jQuery('li[data-role="option_dropdown"]').removeClass('optionDropdownActive');
					jQuery('ul[data-role="output_wrapper"]').removeClass('outputWrapperActive');
				} else {
					jQuery('li[data-role="option_dropdown"]').addClass('optionDropdownActive');
					jQuery('ul[data-role="output_wrapper"]').addClass('outputWrapperActive');
				}
			});
		},
		setup_textareas: function() {
			jQuery('#content_input_data').bind('input propertychange', function() {
				if (jQuery('#content_input_data').val() != '') {
					method.toggle_output_type(jQuery(".optionButtonActive").attr('data-property'));
					jQuery('div[data-role="container_split"]').addClass('containerSplitActive');
					jQuery('#content_data_output').removeClass('contentHidden');
				} else {
					jQuery('#content_data_output').addClass('contentHidden');
					jQuery('div[data-role="container_split"]').removeClass('containerSplitActive');
				}
			})
			var textBox = document.getElementById("content_output_data");
    		textBox.onfocus = function() {
		        textBox.select();
		        textBox.onmouseup = function() {
		            textBox.onmouseup = null;
    	        	return false;
        		};
    		};
		},
		toggle_output_type: function(a) {
			if (a != 'table' && a != 'xml' && a != 'kml') {
	    		jQuery('#content_output_data').val(JSON.stringify(parse_csv_json.init(jQuery('#content_input_data').val(),a)));
			} else {
	    		parse_csv_json.init(jQuery('#content_input_data').val(),a);
	    		jQuery('#content_output_data').val(jQuery('#table_converter').html())
			}
		},
		setup_drag_drop: function() {
			document.getElementById('content_data_drag').addEventListener('dragover', method.handle_drag_over, false);
			document.getElementById('content_data_drag').addEventListener('dragleave', method.handle_drag_out, false);
			document.getElementById('content_data_drag').addEventListener('dragend', method.handle_drag_out, false);
        	document.getElementById('content_data_drag').addEventListener('drop', method.handle_file_selection, false);
		},
		handle_drag_over: function(evt) {
			jQuery('#content_data_drag').addClass('contentDragableHover');
			evt.stopPropagation();
		    evt.preventDefault();
		},
		handle_drag_out: function(evt) {
			jQuery('#content_data_drag').removeClass('contentDragableHover');
			evt.stopPropagation();
		    evt.preventDefault();
		},
		
		handle_file_read_abort: function (evt) {
    		alert("File read aborted.");
		},
		handle_file_read_error: function(evt) {
    		var message;
			switch (evt.target.error.name) {
        		case "NotFoundError":
		            alert("The file could not be found!");
        		    break;
		        case "SecurityError":
        		    message = "A file security error occured. This can be due to:";
		            message += "Accessing certain files deemed unsafe for Web applications.";
		            message += "The file has changed on disk since the user selected it.";
        		    alert(message);
		            break;
        		case "NotReadableError":
		            alert("The file cannot be read. This can occur if the file is open in another application.");
        		    break;
		        case "EncodingError":
        		    alert("The length of the data URL for the file is too long.");
		            break;
        		default:
		            alert("File error code " + evt.target.error.name);
    		}
		},
		start_file_read: function(fileObject) {
			var reader = new FileReader();
			if (fileObject.type.match('text/csv')) {
			    reader.onloadend = method.display_file_text; 
			} else if (fileObject.type.match('text/kml') || fileObject.name.indexOf('.kml') != -1) {
				reader.onloadend = method.display_kml_text; 
			}
    		reader.onerror = method.handle_file_read_error;
		    if (fileObject) {
        		reader.readAsText(fileObject);
    		}
		},
		handle_file_selection: function(evt) {
			jQuery('#content_data_drag').removeClass('contentDragableHover');
    		evt.stopPropagation();
    		evt.preventDefault();
    		if (evt.type.toString().toLowerCase() == 'change') {
				var files = evt.target.files;
			} else {
	    		var files = evt.dataTransfer.files;
			}
			if (!files) {
        		alert("At least one selected file is invalid - do not select any folders.</p><p>Please reselect and try again.");
        		return;
    		}
    		for (var i = 0, file; file = files[i]; i++) {
        		if (!file) {
            		alert("Unable to access " + file.name);
            		return false
        		}
        		if (file.size == 0) {
            		alert(file.name.toUpperCase() + " is empty");
            		return false
        		}
        		if (file.size >= 1048576) {
        			alert(file.name.toUpperCase() + " is too big. Files must be under 1MB");
            		return false
        		}
        		if (!file.type.match('text/csv') && file.name.indexOf('.csv') == -1 && !file.type.match('text/kml') && file.name.indexOf('.kml') == -1){
            		alert(file.name.toUpperCase() + " is not a csv, please only select a csv file");
	            	return false
        		}
        		method.start_file_read(file);
    		}
		},  
		display_file_text: function(evt) {
			var _file_contents = evt.target.result
    		jQuery('#content_input_data').val(_file_contents);
			method.toggle_output_type(jQuery(".optionButtonActive").attr('data-property'));
			jQuery('div[data-role="container_split"]').addClass('containerSplitActive');
			jQuery('#content_data_output').removeClass('contentHidden');
		},
		display_kml_text: function(evt) {
			var _file_contents = evt.target.result
    		jQuery('#content_input_data').val(_file_contents);
    		jQuery('.optionButtonActive').removeClass('optionButtonActive');
    		jQuery('.optionWrapper').find('.optionButton').each(function() {
				if (typeof jQuery(this).attr('data-property') !== typeof undefined && jQuery(this).attr('data-property') !== false) {
					jQuery(this).addClass('optionButtonNotActive')
				}
			})
    		jQuery("li[data-role='option_5']").removeClass('optionButtonNotActive').addClass('optionButtonActive');
			jQuery('#content_output_data').val(JSON.stringify(toGeoJSON.kml(jQuery.parseXML(_file_contents))));
			jQuery('div[data-role="container_split"]').addClass('containerSplitActive');
			jQuery('#content_data_output').removeClass('contentHidden');
		}
	}
	return method;
})();