// forked from https://github.com/mapbox/togeojson and modified
var toGeoJSON = (function () {
    'use strict';
    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        }
        return h;
    }
    function get(x, y) {
        return x.getElementsByTagName(y);
    }

    function attr(x, y) {
        return x.getAttribute(y);
    }

    function attrf(x, y) {
        return parseFloat(attr(x, y));
    }
    function get1(x, y) {
        var n = get(x, y);
        return n.length ? n[0] : null;
    }
    function norm(el) {
        if (el.normalize) {
            el.normalize();
        }
        return el;
    }
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }

    function clean(x) {
        var o = {};
        for (var i in x)
            if (x[i]) o[i] = x[i];
        return o;
    }
    function nodeVal(x) {
        if (x) {
            norm(x);
        }
        return (x && x.firstChild && x.firstChild.nodeValue) || '';
    }
    function coord1(v) {
        return numarray(v.replace(removeSpace, '').split(','));
    }
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) {
        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
            ele = get1(x, 'ele');
        if (ele) ll.push(parseFloat(nodeVal(ele)));
        return ll;
    }
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }
    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new(require('xmldom').XMLSerializer)();
    }
    function xml2str(str) {
        return serializer.serializeToString(str);
    }
    var t = {
        kml: function (doc, o) {
            o = o || {};
            var gj = fc(),
                styleIndex = {},
                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style'),
                stylemap = get(doc, 'StyleMap');
            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = getPlacemark(styles[k], false)
            }
            for (var m = 0; m < stylemap.length; m++) {
                styleIndex['#' + attr(stylemap[m], 'id')] = getPlacemark(stylemap[m], false)
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j], true));
            }
            function kmlColor(v) {
                var color, opacity;
                v = v || "";
                if (v.substr(0, 1) === "#") v = v.substr(1);
                if (v.length === 6 || v.length === 3) color = v;
                if (v.length === 8) {
                    opacity = parseInt(v.substr(0, 2), 16) / 255;
                    color = v.substr(2);
                }
                return [color, isNaN(opacity) ? undefined : opacity];
            }
            function gxCoord(v) {
                return numarray(v.split(' '));
            }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'),
                    coords = [];
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root, bool) {
                var geoms = getGeometry(root),
                    i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    styleMap = nodeVal(get1(root, 'StyleMap')),
                    description = nodeVal(get1(root, 'description')),
                    timeSpan = get1(root, 'TimeSpan'),
                    extendedData = get1(root, 'ExtendedData'),
                    lineStyle = get1(root, 'LineStyle'),
                    polyStyle = get1(root, 'PolyStyle'),
                    iconStyle = get1(root, 'IconStyle');				
                if (bool && !geoms.length) return [];
                if (name) properties.name = name;
                if (!bool) properties.id = $(root).attr('id');
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styles = styleIndex[styleUrl];
                    if (styleUrl + '-hover' in styleIndex) {
                    	properties.map = true;
                    	properties.style_hover = styleIndex[styleUrl+'-hover'];
                    	properties.styleUrl_hover = styleUrl+'-hover';
                    }
                } 
                if (description) properties.description = description;
                if (timeSpan) {
                    var begin = nodeVal(get1(timeSpan, 'begin'));
                    var end = nodeVal(get1(timeSpan, 'end'));
                    properties.timespan = {
                        begin: begin,
                        end: end
                    };
                }
                if (polyStyle) {
                    var polystyles = kmlColor(nodeVal(get1(polyStyle, 'color'))),
                        pcolor = polystyles[0],
                        popacity = polystyles[1],
                        fill = nodeVal(get1(polyStyle, 'fill')),
                        outline = nodeVal(get1(polyStyle, 'outline'));
                    if (pcolor) properties.fill = pcolor;
                    if (!isNaN(popacity)) properties['fill-opacity'] = popacity;
                    if (fill) properties['fill-opacity'] = fill === "1" ? 1 : 0;
                    if (outline) properties['stroke-opacity'] = outline === "1" ? 1 : 0;
                }
                if (lineStyle) {
                    var linestyles = kmlColor(nodeVal(get1(lineStyle, 'color'))),
                        color = linestyles[0],
                        opacity = linestyles[1],
                        width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                    if (color) properties.stroke = color;
                    if (!isNaN(opacity)) properties['stroke-opacity'] = opacity;
                    if (!isNaN(width)) properties['stroke-width'] = width;
                }
                if (iconStyle) {
                	var icon = nodeVal(get1(iconStyle, 'href'));
                	if (icon) properties['icon'] = icon
                }
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');
                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                    if (bool && datas.length == 0 && simpleDatas.length == 0) {
                    	for (var p = 0; p < jQuery(extendedData).children().length; p++) {  
	                    	 properties[jQuery(extendedData).children()[p].nodeName] = jQuery(jQuery(extendedData).children()[p]).text()
	                    }
                    }
                }
				
                if (bool) {
                	
	                return [{
    	                type: 'Feature',
        	            geometry: (geoms.length === 1) ? geoms[0] : {
            	            type: 'GeometryCollection',
                	        geometries: geoms
                    	},
	                    properties: properties
    	            }];
    	        } else {
					return properties
    	        }
            }
            return gj;
        }
    };
    return t;
})();