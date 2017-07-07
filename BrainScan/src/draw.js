"use strict";

/** @constructor */
function LifeCanvasDrawer(arg_life,arg_brain_pattern,arg_regions,arg_chemdata)
{
	
    var
		// where is the viewport in pixels, from 0,0
        /** @type {number} */
        canvas_offset_x = 0,
        /** @type {number} */
        canvas_offset_y = 0,

        canvas_width,
        canvas_height,

        // canvas contexts
        canvas,
		iconcanvas = document.getElementById("iconcanvas"),
		overlaycanvas = document.getElementById("overlaycanvas"),
        context,
		iconcontext = iconcanvas.getContext("2d"),
		overlaycontext = overlaycanvas.getContext("2d"),

        image_data,
        image_data_data,

        // in pixels
        border_width,
        cell_color_rgb,
		selected_color_rgb,
		
		brain_regions,
		
		//Data
		
		node = arg_life,
		brain_pattern=arg_brain_pattern,
		regions=arg_regions,
		chemdata=arg_chemdata,
		lookup = {},

        drawer = this;

	this.model="Star";
    this.cell_color = "#634636";
	this.selected_color = "#A5755A";
    this.background_color = "#cccccc";
	this.chem_colors = ["#fb8072","#80b1d3","#fdb462","#ffed6f","#bc80bd"];
	this.selected_region=1;
	this.previous_range = [];
	this.current_age_range = [];//This might be depreciated now
	this.complete_age_range;//This is used to determine partial age ranges
	this.region_averages = new Array(130);
	this.corrected_coords = new Array(130);
	this.chem_icons = new Array(130);//This contains the currently generated icons in DATAURL format(To be used when we want to change icons)
	this.chem_regions = new Array(130);//Contains chem data based on region
	//Icons will only be changed then the age range changes, otherwise all icons are stored in the chem_icons array for quick changing

    // given as ratio of cell size
    this.border_width = 0;
	
    this.init = init;
    this.redraw = redraw;
    this.move = move;
    this.zoom = zoom;
    this.zoom_centered = zoom_centered;
    this.fit_bounds = fit_bounds;
    this.set_size = set_size;
    this.draw_cell = draw_cell;
    this.center_view = center_view;
    this.zoom_to = zoom_to;
    this.pixel2cell = pixel2cell;
	this.setupRegions = setupRegions;
	this.changeSelectedRegion=changeSelectedRegion;
	this.loadLookupTable=loadLookupTable;
	this.set_overlay=set_overlay;
	this.changeModel=changeModel;
	this.performRangeChange=performRangeChange;
	this.updateAgeRange=updateAgeRange;
	
	function readFile(directory){
		$.ajax({
		type:    "GET",
		url:     directory,
		success: function(text) {		
				var lines=text.split('\n');
				//we want to create a hashtable which gives us the region number when given a string
				for(var i=0;i<lines.length;i++){
					var parts = lines[i].split('\t');
					lookup[parts[1].replace("_"," ")] = parseInt(parts[0]);
				}
				console.log("Reading done");
				setupRegionShapes();
				
		},
		error:   function() {
			// An error occurred
			alert("cannot read files from server");
		}
		});
	}
	//Updates JUST the HUD
	function updateAgeRange(rangeId){
		drawer.previous_range[rangeId] = getSliderRange(rangeId);
		
		drawer.current_age_range[rangeId] = convertToAgeRange(drawer.previous_range[rangeId]);
		
		//We only want to update the ages, don't update EVERYTHING
		writeAgeRanges();
		
	}
	//Checks if the slider has moved since the last update
	//This function doesn't work quite right
	function isRangeSame(rangeId){
		if(!drawer.previous_range[rangeId]){
			return false;
		}
		var sliderRange = getSliderRange(rangeId);
		if(drawer.previous_range[rangeId].min == sliderRange.min && drawer.previous_range[rangeId].max == sliderRange.max)
			return true;
		return false;
	}
	
	//It will check what the current range is for the rangeId and update all the icons accordingly
	function performRangeChange(rangeId){
		//if(isRangeSame(rangeId))		//We gotta check if the sliderRange is the same as the previous one
			//return;
		var sliderRange = getSliderRange(rangeId);
		var ageRange = convertToAgeRange(sliderRange);
		
		console.log(""+rangeId+":("+ageRange.min+","+ageRange.max+")");
		setupRegionShapes();
	}
	
	//Returns an array of all indices 
	function ageRangeToIndices(ageRange){
		//We need to iterate through all the ages and mark down the indices we want.
		//We will start at 2 so the indices match the row number so we don't go insane
		var indices = [];
		var sheet = chemdata.Sheets["Age"];//Let's get the age sheet
		var min = ageRange.min;
		var max = ageRange.max;
		//There are only 2 columns, of which only one is needed... for now...
		for(var row = 2;row<=80;row++){
			var value = sheet["B"+row].w;
			var num_value = parseFloat(value);
			if(num_value<=max&&num_value>=min)
				indices.push(row);
		}
		return indices;
	}
	
	//Receives a range between 0-100 and uses the complete_age_range array to get the range in age values
	function convertToAgeRange(sliderRange){
		var cAgeRange = getCompleteAgeRange();
		return {min:Math.floor(cAgeRange.min+sliderRange.min/100*(cAgeRange.max-cAgeRange.min)), 
			max:Math.floor(cAgeRange.min+sliderRange.max/100*(cAgeRange.max-cAgeRange.min))};
	}
	
	//Calculate the range of the requested range, returns object with range
	function getSliderRange(rangeId){
		var rangeElement = document.getElementsByClassName('range'+rangeId+" multirange original")[0];
		return {min:rangeElement.valueLow, max:rangeElement.valueHigh};
	}
	//Takes in the name of the model(same as the string in the drop-down)
	function changeModel(model){
		console.log("Model changed to "+model);
		drawer.model=model;
		//Change the string in the model-changer
		var model_changer = document.getElementById("model-changer");
		model_changer.innerText = model;
		//Replace all the button dataurls with the appropriate icons
		updateButtonIcons();
		drawer.redraw();
	}
	//Checks the modal style and changes the icons
	function updateButtonIcons(){
		var buttons = document.getElementById("buttons").childNodes;
		for(var i=0;i<buttons.length;i++){
			//Get the element ids
			var region = parseInt(buttons[i].id.split("button")[1]);
			if(typeof drawer.chem_icons[region-1][0][drawer.model] !== 'undefined'){
				var current_button = buttons[i];
				current_button.style.backgroundImage = 'url(' + drawer.chem_icons[region-1][0][drawer.model] + ')';
			}
			else{
				console.log("Model "+drawer.model+" does not have an icon!");
				break;
			}
		}
		writeRegionInfo();
	}
	function changeSelectedRegion(regionNum){
		drawer.selected_region=regionNum;
		//console.log(regionNum);
		//console.log(drawer.region_averages[regionNum-1]);
		
		drawer.redraw();
		writeRegionInfo();
	}
	
	//This creates an ndarray which changes the 3 dimension to the types of regions that exist
	function setupRegions(){
		var buffer=[];
		//Iterate through all i and j coordinates
		for(var i=0; i<brain_pattern.shape[2]; ++i) {
			for(var j=0; j<brain_pattern.shape[3]; ++j) {
				buffer=[];
				//We have the coordinates, iterate through the depth
				for(var x=0; x<brain_pattern.shape[1];x++){
					//If the value at the depth we are at exists in the buffer, skip
					var region_value = brain_pattern.get(0,x,i,j);
					if(!buffer.includes(region_value))
						buffer.push(region_value);
					
				}
				//We have the buffer, let's insert it into the ndarray
				//console.log(buffer);
				regions.set(i,j,buffer);
			}
		}
		brain_regions=regions;
		//We have the region data, now let's get the region average data
		for(var i=0;i<130;i++){
			drawer.region_averages[i]=getRegionAverage(i+1);
		}
		
		//Let's calculate the corrected 
		setupCorrectedCoords();
	}
	//Greedy algorithm which ensures that all buttons do not touch
	function setupCorrectedCoords(){
		//We will need a hashtable
		var usedCoords = {};
		for(var i=0;i<130;i++){
			//make sure that we actually have an average
			if(!isNaN(drawer.region_averages[i].x)||!isNaN(drawer.region_averages[i].y)){
				//Calculate the corrected coordinates
				var tempx = Math.floor(drawer.region_averages[i].x/8);
				var tempy = Math.floor(drawer.region_averages[i].y/8);
				//Check if this slot has been used
				if (hitCoord(usedCoords,tempx,tempy,i+1)){
					//It hit, we gotta check surrounding coords now for an empty slot
					if(!hitCoord(usedCoords,tempx-1,tempy,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+1,tempy,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx,tempy-1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx,tempy+1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx-1,tempy-1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+1,tempy-1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx-1,tempy+1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+1,tempy+1,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx-2,tempy,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+2,tempy,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx,tempy-2,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx,tempy+2,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx-2,tempy-2,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+2,tempy-2,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx-2,tempy+2,i+1))//If it misses, continue
						continue;
					if(!hitCoord(usedCoords,tempx+2,tempy+2,i+1))//If it misses, continue
						continue;
					console.log("Warning, all aux slots hit, unable to allocate location for region "+(i+1));
				}
			}
		}
	}
	//Returns if the coords resulted in a hit
	function hitCoord(usedCoords,x,y,region){
		if (typeof usedCoords[""+x+" "+y] == 'undefined'){
			//The slot is free! Let's put the region number in it
			usedCoords[""+x+" "+y] = region;
			drawer.corrected_coords[region-1] = {x:(x*8+4), y:(y*8+4)};
			//console.log("Region "+region+" put in slot "+x+","+y);
			return false;//It missed
		}
		//else
			//console.log("Oh no! Slot used up by region "+usedCoords[""+x+" "+y]);
		return true;//It hit(this is bad)
	}
	function loadLookupTable(){
		console.log(chemdata);
		readFile("data/JhuMniSSTypeIILabelLookupTable_edited.txt");
	}
	
	//This function tests if the completeAgeRange exists and if not, creates it from data
	function getCompleteAgeRange(){
		//Test if the complete age range exists
		if(!drawer.complete_age_range){
			var sheet = chemdata.Sheets["Age"];
			var min = 10000000;
			var max = -1;
			//There are only 2 columns, of which only one is needed... for now...
			for(var row = 2;row<=80;row++){
				var value = sheet["B"+row].w;
				var num_value = parseFloat(value);
				if(num_value>max)
					max = num_value;
				if(num_value<min)
					min = num_value;
			}
			console.log("Age:("+min+","+max+")");
			drawer.complete_age_range = {min:min, max:max};
		}
		return drawer.complete_age_range;
	}
	
	//We will need 
	function setupRegionShapes(){
		
		//If the ageRange is empty then we will use the complete_age_range
		//Basically, if there is no argument given then the function assumes we want all ages
		if(!drawer.current_age_range[0])
			drawer.current_age_range[0] = getCompleteAgeRange();
		if(!drawer.current_age_range[1])
			drawer.current_age_range[1] = getCompleteAgeRange();
		
		//We have our ageRange, let's convert it to an index array(array with the indexes we want)
		
		//console.log(iArray);
		
		//Let's create shapes and assign them to the appropriate div
		//Let's make sure this thing works
		//console.log(lookup);
		//asd
		
		//We want there to be objects in the chemregions array
		initChemRegions();
		
		//Let's get the ranges for all the possible chemicals(just the first subject)
		var ranges = {min:10000000, max:-1};
		//Get teh global range from the entire sheet
		for(var i=0;i<5;i++){
			//Let's get the sheet name
			var sheetName = chemdata.SheetNames[i];
			ranges = getRange(sheetName,ranges);//This may become depreciated
		}
		//We will store the data in a 130 size array, each will be an object which contains the values for each chemical
		
		for(var rangeNum=0;rangeNum<2;rangeNum++){
			//Get the chemvalues for the range number
			for(var i=0;i<5;i++){
				var iArray = ageRangeToIndices(drawer.current_age_range[rangeNum]);
				var sheetName = chemdata.SheetNames[i];
				getChemValues(sheetName, iArray);
			}
			console.log(drawer.chem_regions);
			
			//Set all the backgrounds
			var buttons = document.getElementById("buttons").childNodes;
			for(var i=0;i<buttons.length;i++){
				//Draw the pentagon to the iconcanvas
				iconcanvas.width = 112
				iconcanvas.height = 112;
				iconcontext.clearRect(0, 0, 112, 112);
				//iconcontext.drawImage(pentaCanvas,0 , 0, 112, 112, 0, 0, 112, 112);
				
				//Get the element ids
				var region = parseInt(buttons[i].id.split("button")[1]);
				//We have the region id, use that to get the chemical values
				var r_data = drawer.chem_regions[region-1][0];
				//Calculate the ratios, inserting zeros for null data
				var ratios = new Array(5);
				for(var j=0;j<5;j++){
					var sheetName = chemdata.SheetNames[j];
					var c_data = r_data[sheetName];
					if(c_data !== 'no data'&&c_data !== "<Min#"){
						ratios[j] = (c_data)/(ranges.max);
					}
					else{
						ratios[j] = 0;
					}
				}
				//Draw the pentagon stuffs
				drawPentagon(iconcanvas,iconcontext,52,-1/2*Math.PI,112,'#99ff99','#2F4F4F',ratios);
				
				//Put them in the icons array
				var dataURL = iconcanvas.toDataURL();
				drawer.chem_icons[region-1][rangeNum]["Star"] = dataURL;
				
				//Creating the bar icons
				iconcanvas.width = 112
				iconcanvas.height = 112;
				iconcontext.clearRect(0, 0, 112, 112);
				
				drawBars(iconcanvas,iconcontext,112,'#2F4F4F',ratios);
				//Put them in the icons array
				var dataURL = iconcanvas.toDataURL();
				drawer.chem_icons[region-1][rangeNum]["Bars"] = dataURL;
				
				//Creating the spatial icons
				iconcanvas.width = 112
				iconcanvas.height = 112;
				iconcontext.clearRect(0, 0, 112, 112);
				
				drawSpatial(iconcanvas,iconcontext,112,'#2F4F4F',ratios);
				//Put them in the icons array
				var dataURL = iconcanvas.toDataURL();
				drawer.chem_icons[region-1][rangeNum]["Spatial"] = dataURL;
				
				//Creating the spatial icons
				iconcanvas.width = 112
				iconcanvas.height = 112;
				iconcontext.clearRect(0, 0, 112, 112);
				
				drawSBars(iconcanvas,iconcontext,112,'#2F4F4F',ratios);
				//Put them in the icons array
				var dataURL = iconcanvas.toDataURL();
				drawer.chem_icons[region-1][rangeNum]["Staggered Bars"] = dataURL;
				
			}
		}
		updateButtonIcons();
		drawer.redraw();
		writeRegionInfo();
	}
	//Draws the staggered bars
	function drawSBars(canvas,ctx,canvasw,bordercolor,data){
		//Let's start by drawing the bottom line
		ctx.fillStyle = bordercolor;
		var axis_length = 100;
		var axis_width = 8;
		var axis_x = (canvasw-axis_length)/2;
		var axis_y = canvasw-8;
		var max_bar_length = canvasw-axis_width;
		var bar_ratio = 1.5;
		ctx.fillRect(axis_x,axis_y,axis_length,axis_width);
		
		//First we need to draw the LARGEST ratio and work backwards
		//Or... we could sort some indices using some magic
		var len = data.length;
		var indices = new Array(len);
		for (var i = 0; i < len; ++i) indices[i] = i;
		indices.sort(function (a, b) { return data[a] < data[b] ? -1 : data[a] > data[b] ? 1 : a < b ? -1 : 1; });
		
		for(var i=len-1;i>=0;i--){
			//Get the index
			var index = indices[i];
			
			//Get the data
			var ratio = data[index];
			
			//Draw the thing using the index and the ratio
			
			ctx.beginPath();
			ctx.fillStyle = drawer.chem_colors[index];
			ctx.fillRect(axis_x+((axis_length*(len-bar_ratio)/(len-1)))*index/len,axis_y-ratio*max_bar_length,axis_length*bar_ratio/len,ratio*max_bar_length);
			ctx.strokeStyle = bordercolor;
			ctx.stroke();
		}
		
		/*
		//Draw the rectangles on the left first
		ctx.fillStyle = drawer.chem_colors[0];
		ctx.fillRect(canvasw/2-2-data[0]*bar_length,canvasw/2-1.5*bar_width,data[0]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[0]*bar_length,canvasw/2-1.5*bar_width,data[0]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[1];
		ctx.fillRect(canvasw/2-2-data[1]*bar_length,canvasw/2-.5*bar_width,data[1]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[1]*bar_length,canvasw/2-.5*bar_width,data[1]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[2];
		ctx.fillRect(canvasw/2-2-data[2]*bar_length,canvasw/2+.5*bar_width,data[2]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[2]*bar_length,canvasw/2+.5*bar_width,data[2]*bar_length,bar_width);
		
		//Draw the rectangles on the right side
		ctx.fillStyle = drawer.chem_colors[3];
		ctx.fillRect(canvasw/2+2,canvasw/2-bar_width,data[3]*bar_length,bar_width);
		ctx.rect(canvasw/2+2,canvasw/2-bar_width,data[3]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[4];
		ctx.fillRect(canvasw/2+2,canvasw/2,data[4]*bar_length,bar_width);
		ctx.rect(canvasw/2+2,canvasw/2,data[4]*bar_length,bar_width);
		*/
		
		
	}
	
	//Draws spatial icon
	function drawSpatial(canvas,ctx,canvasw,bordercolor,data){
		
		//draw([.5,.5,.5,.5]);
		
		var totalRatio = data.reduce(add, 0);

		function add(a, b) {
			return a + b;
		}
		//N.y = a
		//E.x = b
		//S.y = c
		//W.x = d
		
		
		//Obsolete equations
		//A
		//112*A*x/(A+B) + 112A*112A/(A^2+A*B+A*D+B*D)-x*d+112*A*d/(A+D) = 112^2*A/(A+B+C+D+E)
		//112*a/(1+1) + 112*112/(1+1+1+1)-a*d+112*d/(1+1) = 112^2/(1+1+1+1+1)
		
		//B
		//112^2*B/(B+E) + 112^2*B/(B+E) - 112*B*b/(B+E) + x*b - 112^2*A*B/(A*B+B^2+A*E+B*E) + 112*A*x/(A+B) = 112^2*B/(A+B+C+D+E)
		//112^2/(1+1) + 112^2/(1+1) - 112*b/(1+1) + a*b - 112^2/(1+1+1+1) + 112*a/(1+1) = 112^2/(1+1+1+1+1)
		
		//D
		//-112*A*d/(A+D) + d*c -112^2*A*D/(A*D+D^2+A*E+D*E) + 112^2*D/(D+E) - 112*D*c/(D+E) + 112^2*D/(D+E) = 112^2*D/(A+B+C+D+E)
		//-112*d/(1+1) + d*c -112^2/(1+1+1+1) + 112^2/(1+1) - 112*c/(1+1) + 112^2/(1+1) = 112^2/(1+1+1+1+1)
		
		//E
		//112^2-112^2*D/(D+E) + 112*D*d/(D+E) - 112^2*D/(D+E) + 112^2*D*B/(D*B+D*E+B*E+E^2) - b*c + 112*B*b/(B+E) - 112^2*B/(B+E) + 112^2 -112^2*B/(B+E) = 112^2*E/(A+B+C+D+E)
		//112^2-112^2/(1+1) + 112*d/(1+1) - 112^2/(1+1) + 112^2/(1+1+1+1) - b*c + 112*b/(1+1) - 112^2/(1+1) + 112^2 -112^2/(1+1) = 112^2/(1+1+1+1+1)
		
		
		var nx=canvasw*data[0]/(data[0]+data[1]);
		var wy=canvasw*data[0]/(data[0]+data[3]);
		var sx=canvasw*data[3]/(data[3]+data[4]);
		var ey=canvasw*data[1]/(data[1]+data[4]);
		var cArea = canvasw*canvasw*data[2]/totalRatio;
		var margin;
		//We need to establish the coefficients for NSEW
		//These coefficients are the MAX distance the cardinal can go from the EDGE
		var nMargin = Math.min(wy,ey);
		var eMargin = Math.min(canvasw-nx,canvasw-sx);
		var sMargin = Math.min(canvasw-ey,canvasw-wy);
		var wMargin = Math.min(nx,sx);
		//We are gonna brute force this, we are out of time
		for(var i=100; i>=0; i--){
			//Get the formula
			var marginPercent = i/100;//As the margin decreases, the area of C increases
			var tempNy = nMargin*marginPercent; 
			var tempEx = canvasw-eMargin*marginPercent;
			var tempSy = canvasw-sMargin*marginPercent;
			var tempWx = wMargin*marginPercent;
			
			var margin = i;
			var result = (nx*ey-tempEx*tempNy)+(tempEx*tempSy-sx*ey)+(sx*wy-tempWx*tempSy)+(tempWx*tempNy-nx*wy);
			if(result>cArea){
				break;
			}
		}
		
		drawS(margin);
		
		//Let's just draw a normal diamond
		function drawS(length){
			var marginPercent = length/100
			var tempNy = nMargin*marginPercent; 
			var tempEx = canvasw-eMargin*marginPercent;
			var tempSy = canvasw-sMargin*marginPercent;
			var tempWx = wMargin*marginPercent;
			//Ratios go N E S W
			var N = {x:nx, y:tempNy};
			var E = {x:tempEx, y:ey};
			var S = {x:sx, y:tempSy};
			var W = {x:tempWx, y:wy};
			
			ctx.strokeStyle = bordercolor;
			//Let's start by drawing the NW shape
			ctx.fillStyle = drawer.chem_colors[0];
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(N.x,0);
			ctx.lineTo(N.x,N.y);
			ctx.lineTo(W.x,W.y);
			ctx.lineTo(0,W.y);
			ctx.lineTo(0,0);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			//Let's draw the NE shape
			ctx.fillStyle = drawer.chem_colors[1];
			ctx.beginPath();
			ctx.moveTo(canvasw,0);
			ctx.lineTo(canvasw,E.y);
			ctx.lineTo(E.x,E.y);
			ctx.lineTo(N.x,N.y);
			ctx.lineTo(N.x,0);
			ctx.lineTo(canvasw,0);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			//Let's draw the center shape
			ctx.fillStyle = drawer.chem_colors[2];
			ctx.beginPath();
			ctx.moveTo(N.x,N.y);//N
			ctx.lineTo(E.x,E.y);//E
			ctx.lineTo(S.x,S.y);//S
			ctx.lineTo(W.x,W.y);//W
			ctx.lineTo(N.x,N.y);//N
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			//Let's draw the SW shape
			ctx.fillStyle = drawer.chem_colors[3];
			ctx.beginPath();
			ctx.moveTo(0,canvasw);
			ctx.lineTo(0,W.y);
			ctx.lineTo(W.x,W.y);
			ctx.lineTo(S.x,S.y);
			ctx.lineTo(S.x,canvasw);
			ctx.lineTo(0,canvasw);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
			//Let's draw the SE shape
			ctx.fillStyle = drawer.chem_colors[4];
			ctx.beginPath();
			ctx.moveTo(canvasw,canvasw);
			ctx.lineTo(S.x,canvasw);
			ctx.lineTo(S.x,S.y);
			ctx.lineTo(E.x,E.y);
			ctx.lineTo(canvasw,E.y);
			ctx.lineTo(canvasw,canvasw);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			
		}
	}
	
	function initChemRegions(){
		for(var i=0;i<drawer.chem_regions.length;i++)
			drawer.chem_regions[i]={0:{},1:{}};
		for(var i=0;i<drawer.chem_icons.length;i++)
			drawer.chem_icons[i]={0:{},1:{}};
	}
	//Given a number, converts from numeric-base10 to alpha-base26
	function numToAlpha(a) {
		var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		// First figure out how many digits there are.
		var c = 0;
		var x = 1;      
		while (a >= x) {
			c++;
			a -= x;
			x *= 26;
		}

		// Now you can do normal base conversion.
		var s = "";
		for (var i = 0; i < c; i++) {
			s = alpha.charAt(a % 26) + s;
			a = Math.floor(a/26);
		}

		return s;
	}
	
	//Given a string of letters, converts from alpha-base26 to numeric-base10
	function alphaToNum(string){
		var total = 0;
		for(var i=0;i<string.length;i++){
			var value = string.charCodeAt(i)-64;//Value
			total = total + value*26;
		}
		return total;
	}
	
	
	
	//Populates the chem_regions array with appropriate objects
	function getChemValues(sheetName, indices){
		//Get the sheet
		var sheet = chemdata.Sheets[sheetName];
		//var min = currentRange['min'];
		//var	max = currentRange['max'];
		//Gonna hardcode the number of columns
		for(var i=2;i<=108;i++){
			var column = numToAlpha(i);
			var title = sheet[column+"1"].w;
			var total = 0;
			var count = 0;
			//Calculate the average
			if(!indices){
				for(var row = 2;row<=80;row++){
					var value = sheet[column+""+row].w;
					if(value !== 'no data'&&value !== "<Min#"){
						total += parseFloat(value);
						count++;
					}
				}
			}
			else{
				for(var index = 0;index<indices.length;index++){
					var value = sheet[column+""+indices[index]].w;
					if(value !== 'no data'&&value !== "<Min#"){
						total += parseFloat(value);
						count++;
					}
					
				}
			}
					
			drawer.chem_regions[lookup[title]-1][0]["region"] = title;
			if(count != 0){
				var num_value = Math.round(total/count);
				drawer.chem_regions[lookup[title]-1][0][sheetName] = num_value;
				//TODO Calculate the average using this function to normalize it based on displayed values
				//if(num_value>max)
				//	max = num_value;
				//if(num_value<min)
				//	min = num_value;
				
			}
			else{
				drawer.chem_regions[lookup[title]-1][0][sheetName] = "Invalid Values";
			}
		}
		//return {min:min, max:max};
	}
	
	//Given a sheetname, returns the lowest and highest values in an object
	//WARNING, THIS MIGHT BECOME DEPRECIATED
	function getRange(sheetName,currentRange){
		//Get the sheet
		var sheet = chemdata.Sheets[sheetName];
		var min = 10000000;
		var max = -1;
		if(currentRange){
			min = currentRange['min'];
			max = currentRange['max'];
		}
		//Gonna hardcode the number of columns
		//console.log(sheet);
		for(var i=2;i<=108;i++){
			var column = numToAlpha(i);
			for(var row = 2;row<=80;row++){
				var value = sheet[column+""+row].w;
				if(value !== 'no data'&&value !== "<Min#"){
					var num_value = parseFloat(value);
					if(num_value>max)
						max = num_value;
					if(num_value<min)
						min = num_value;
				}
				else{
					//console.log("Encountered unparsable data from sheet "+sheetName+" column "+column+"2");
				}
			}
			
		}
		//console.log(""+sheetName+":("+min+","+max+")");
		return {min:min, max:max};
	}
	
	//Draws the bar graph thingy
	function drawBars(canvas,ctx,canvasw,bordercolor,data){
		//Let's start by drawing the middle divider
		ctx.fillStyle = bordercolor;
		var middle_length = 80;
		var bar_length = canvasw/2-6;
		var bar_width = 16;
		ctx.fillRect(canvasw/2-3,canvasw/2-middle_length/2,6,middle_length);

		//Draw the rectangles on the left first
		ctx.fillStyle = drawer.chem_colors[0];
		ctx.fillRect(canvasw/2-2-data[0]*bar_length,canvasw/2-1.5*bar_width,data[0]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[0]*bar_length,canvasw/2-1.5*bar_width,data[0]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[1];
		ctx.fillRect(canvasw/2-2-data[1]*bar_length,canvasw/2-.5*bar_width,data[1]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[1]*bar_length,canvasw/2-.5*bar_width,data[1]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[2];
		ctx.fillRect(canvasw/2-2-data[2]*bar_length,canvasw/2+.5*bar_width,data[2]*bar_length,bar_width);
		ctx.rect(canvasw/2-2-data[2]*bar_length,canvasw/2+.5*bar_width,data[2]*bar_length,bar_width);
		
		//Draw the rectangles on the right side
		ctx.fillStyle = drawer.chem_colors[3];
		ctx.fillRect(canvasw/2+2,canvasw/2-bar_width,data[3]*bar_length,bar_width);
		ctx.rect(canvasw/2+2,canvasw/2-bar_width,data[3]*bar_length,bar_width);
		
		ctx.fillStyle = drawer.chem_colors[4];
		ctx.fillRect(canvasw/2+2,canvasw/2,data[4]*bar_length,bar_width);
		ctx.rect(canvasw/2+2,canvasw/2,data[4]*bar_length,bar_width);
		
		
		ctx.strokeStyle = bordercolor;
		ctx.stroke();
	}
	
	//Draws a pentagon on the selected canvas
	function drawPentagon(pentaCanvas,pent_ctx,size,aoffset,canvasw,fillcolor,bordercolor,data){
		//We need angular coordinates, let's get some trig in here
		var pie = Math.PI;
		var offset = 4;
		
		//Draw the circles at the corners
		for(var i=0;i<5;i++){
			pent_ctx.fillStyle = drawer.chem_colors[i];
			pent_ctx.beginPath();
			pent_ctx.arc(size*Math.cos(2/5*pie*i+aoffset)+canvasw/2,size*Math.sin(2/5*pie*i+aoffset)+canvasw/2+offset,6,0,2*Math.PI);
			pent_ctx.closePath();
			pent_ctx.fill();
		}
		
		//Draw the shape first
		pent_ctx.beginPath();
		pent_ctx.moveTo(data[0]*size*Math.cos(0+aoffset)+canvasw/2,data[0]*size*Math.sin(0+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(data[1]*size*Math.cos(2/5*pie+aoffset)+canvasw/2,data[1]*size*Math.sin(2/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(data[2]*size*Math.cos(4/5*pie+aoffset)+canvasw/2,data[2]*size*Math.sin(4/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(data[3]*size*Math.cos(6/5*pie+aoffset)+canvasw/2,data[3]*size*Math.sin(6/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(data[4]*size*Math.cos(8/5*pie+aoffset)+canvasw/2,data[4]*size*Math.sin(8/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(data[0]*size*Math.cos(0+aoffset)+canvasw/2,data[0]*size*Math.sin(0+aoffset)+canvasw/2+offset);
		pent_ctx.closePath();
		pent_ctx.fillStyle = fillcolor;
		pent_ctx.fill();
		
		pent_ctx.strokeStyle = bordercolor;
		pent_ctx.stroke();//Adds a border(not actually sure how to clear the path to prevent this...)
		
		
		//Make the guidelines
		pent_ctx.moveTo(canvasw/2,canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(0+aoffset)+canvasw/2,size*Math.sin(0+aoffset)+canvasw/2+offset);
		pent_ctx.moveTo(canvasw/2,canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(2/5*pie+aoffset)+canvasw/2,size*Math.sin(2/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.moveTo(canvasw/2,canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(4/5*pie+aoffset)+canvasw/2,size*Math.sin(4/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.moveTo(canvasw/2,canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(6/5*pie+aoffset)+canvasw/2,size*Math.sin(6/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.moveTo(canvasw/2,canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(8/5*pie+aoffset)+canvasw/2,size*Math.sin(8/5*pie+aoffset)+canvasw/2+offset);
		//Draw the pentagon outline
		pent_ctx.moveTo(size*Math.cos(0+aoffset)+canvasw/2,size*Math.sin(0+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(2/5*pie+aoffset)+canvasw/2,size*Math.sin(2/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(4/5*pie+aoffset)+canvasw/2,size*Math.sin(4/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(6/5*pie+aoffset)+canvasw/2,size*Math.sin(6/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(8/5*pie+aoffset)+canvasw/2,size*Math.sin(8/5*pie+aoffset)+canvasw/2+offset);
		pent_ctx.lineTo(size*Math.cos(0+aoffset)+canvasw/2,size*Math.sin(0+aoffset)+canvasw/2+offset);
		pent_ctx.stroke();
	}
	
	//Given a region number, returns a coordinate object which contains x and y
	function getRegionAverage(regionNum){
		var xTotal=0;
		var yTotal=0;
		var count=0;
		//We want to iterate through all coordinates and average which ones contain our region
		for(var x=0;x<brain_regions.shape[0];x++){
			for(var y=0;y<brain_regions.shape[1];y++){
				//If it contains our region, add the x and y to the total
				if(brain_regions.get(x,y).includes(regionNum)){
					//It contains our region!
					count++;//Increase the count so we can average
					xTotal=xTotal+x;
					yTotal=yTotal+y;
				}
			}
		}
		//We have our totals, average it out, pack it into an object and return
		return {x:(Math.floor(xTotal/count)), y:(Math.floor(yTotal/count))};
	}

    function init(dom_parent)
    {
        canvas = document.getElementById("lazyboard");

        if(!canvas.getContext) {
            return false;
        }

        drawer.canvas = canvas;

        context = canvas.getContext("2d");

        //dom_parent.appendChild(canvas);

        return true;
    }


    function set_size(width, height)
    {
        if(width !== canvas_width || height !== canvas_height)
        {
            canvas_width = canvas.width = width;
            canvas_height = canvas.height = height;

            image_data = context.createImageData(width, height);
            image_data_data = new Int32Array(image_data.data.buffer);

            for(var i = 0; i < width * height; i++)
            {
                image_data_data[i] = 0xFF << 24;
            }
        }
		
    }
	
	function set_overlay(width, height)
    {
		overlaycanvas.width = width;
		overlaycanvas.height = height;
		console.log("Overlay size set to: ("+width+","+height+")");
		var dropdown = document.getElementById("dropdown-menu");
		dropdown.style.top = ""+(height-22)+"px";
		dropdown.style.left = "6px";
		
		var range0 = document.getElementById("range0");
		range0.style.top = ""+(height-46)+"px";
		range0.style.left = "6px";
		
		var range1 = document.getElementById("range1");
		range1.style.top = ""+(height-64)+"px";
		range1.style.left = "6px";
		
    }

    function draw_node(node, size, left, top)
    {
        if(node.population === 0)
        {
            return;
        }

        if(
            left + size + canvas_offset_x < 0 ||
            top + size + canvas_offset_y < 0 ||
            left + canvas_offset_x >= canvas_width ||
            top + canvas_offset_y >= canvas_height
        ) {
            // do not draw outside of the screen
            return;
        }

        if(size <= 1)
        {
            if(node.population)
            {
                fill_square(left + canvas_offset_x | 0, top + canvas_offset_y | 0, 1);
            }
        }
        else if(node.level === 0)
        {
            if(node.population)
            {
                fill_square(left + canvas_offset_x, top + canvas_offset_y, drawer.cell_width);
            }
        }
        else
        {
            size /= 2;

            draw_node(node.nw, size, left, top);
            draw_node(node.ne, size, left + size, top);
            draw_node(node.sw, size, left, top + size);
            draw_node(node.se, size, left + size, top + size);
        }
    }

    function fill_square(x, y, size, selected)
    {
        var width = size - border_width,
            height = width;

        if(x < 0)
        {
            width += x;
            x = 0;
        }

        if(x + width > canvas_width)
        {
            width = canvas_width - x;
        }

        if(y < 0)
        {
            height += y;
            y = 0;
        }

        if(y + height > canvas_height)
        {
            height = canvas_height - y;
        }

        if(width <= 0 || height <= 0)
        {
            return;
        }

        var pointer = x + y * canvas_width,
            row_width = canvas_width - width;
		var color;
		if(selected)
			color = selected_color_rgb.r | selected_color_rgb.g << 8 | selected_color_rgb.b << 16 | 0xFF << 24;
        else
			color = cell_color_rgb.r | cell_color_rgb.g << 8 | cell_color_rgb.b << 16 | 0xFF << 24;

        for(var i = 0; i < height; i++)
        {
            for(var j = 0; j < width; j++)
            {
                image_data_data[pointer] = color;

                pointer++;
            }
            pointer += row_width;
        }
    }


    function redraw()
    {
		//console.log(drawer.selected_region);
        var bg_color_rgb = color2rgb(drawer.background_color);
        var bg_color_int = bg_color_rgb.r | bg_color_rgb.g << 8 | bg_color_rgb.b << 16 | 0xFF << 24;

        border_width = drawer.border_width * drawer.cell_width | 0;
        cell_color_rgb = color2rgb(drawer.cell_color);
		selected_color_rgb = color2rgb(drawer.selected_color)

        var count = canvas_width * canvas_height;

		//Clear everything
        for(var i = 0; i < count; i++)
        {
            image_data_data[i] = bg_color_int;
        }
		
		
		//Draw a slice of the brain using brain_pattern
		//first get the halfway point for the first dimension.
		for(var i=0; i<brain_pattern.shape[2]; ++i) {
			for(var j=0; j<brain_pattern.shape[3]; ++j) {
				var test = brain_regions.get(i,j).length;
				if(test>1){
					//Test if it contains the selected region
					if(brain_regions.get(i,j).includes(drawer.selected_region))
						fill_square(i*drawer.cell_width + canvas_offset_x,j*drawer.cell_width + canvas_offset_y, drawer.cell_width, true);
					else
						fill_square(i*drawer.cell_width + canvas_offset_x,j*drawer.cell_width + canvas_offset_y, drawer.cell_width);
				}
			}
		}
		
		
		updateButtonLocs();
		
		context.putImageData(image_data, 0, 0);
		
		//We need to write the text after the image is drawn or out text will be covered
		//writeRegionInfo();
		
    }
	
	//Uses the chem_regions array to display selected info
	function writeRegionInfo(){
		//Clear the canvas first
		overlaycontext.clearRect(0,0,overlaycanvas.width,overlaycanvas.height);
		var r_data = drawer.chem_regions[drawer.selected_region-1][0];
		//Write out the region name first
		overlaycontext.font = "14px Arial";
		overlaycontext.fillText("Region: "+r_data.region,5,20);
		//Write out the detailed values
		for(var i=0;i<5;i++){
			var sheetName = chemdata.SheetNames[i];
			overlaycontext.fillStyle=drawer.chem_colors[i];
			overlaycontext.fillRect(3,20*(i+1)+7,144,16);
			overlaycontext.fillStyle = '#000000';
			overlaycontext.fillText(sheetName+": "+r_data[sheetName],5,20*(i+2));
		}
		
		//Write out the age range
		writeAgeRanges();
		var img = new Image();
		var img2 = new Image();
		img.onload = function(){
			overlaycontext.globalAlpha = 0.4;
			overlaycontext.drawImage(img,20,140); // Or at whatever offset you like
			overlaycontext.globalAlpha = 1.0;
		};
		img2.onload = function(){
			overlaycontext.globalAlpha = 0.4;
			overlaycontext.drawImage(img2,20,140); // Or at whatever offset you like
			overlaycontext.globalAlpha = 1.0;
		};
		img2.src = drawer.chem_icons[drawer.selected_region-1][1][drawer.model]
		img.src = drawer.chem_icons[drawer.selected_region-1][0][drawer.model];
	}
	function writeAgeRanges(){
		overlaycontext.clearRect(0,overlaycanvas.height-80,overlaycanvas.width,overlaycanvas.height);
		overlaycontext.font = "8px Arial";
		overlaycontext.fillText("Ages: "+drawer.current_age_range[0].min+" - "+drawer.current_age_range[0].max,5,overlaycanvas.height-25);
		overlaycontext.fillText("Ages: "+drawer.current_age_range[1].min+" - "+drawer.current_age_range[1].max,5,overlaycanvas.height-69);
		
	}
	
	function updateButtonLocs(){
		//Iterate through all the buttons?
		var buttons = document.getElementById("buttons").childNodes;
		for(var i=0;i<buttons.length;i++){
			//Get the element ids
			var but_location = drawer.corrected_coords[parseInt(buttons[i].id.split("button")[1])-1];
			var current_button = buttons[i];
			current_button.style.left = (but_location.x*drawer.cell_width + canvas_offset_x - drawer.cell_width*3)+"px";
			current_button.style.top = (but_location.y*drawer.cell_width + canvas_offset_y - drawer.cell_width*3)+"px";
			current_button.style.width = (drawer.cell_width*7)+"px";
			current_button.style.height = (drawer.cell_width*7)+"px";
		}
	}

    /**
     * @param {number} center_x
     * @param {number} center_y
     */
    function zoom(out, center_x, center_y)
    {
			center_x -= canvas.offsetLeft;
			center_y -= canvas.offsetTop;
		
        if(out)
        {
			//Limit zooming out
			if(drawer.cell_width>1){
				canvas_offset_x -= Math.round((canvas_offset_x - center_x) / 2);
				canvas_offset_y -= Math.round((canvas_offset_y - center_y) / 2);

				drawer.cell_width /= 2;
			}
        }
        else
        {
            canvas_offset_x += Math.round(canvas_offset_x - center_x);
            canvas_offset_y += Math.round(canvas_offset_y - center_y);

            drawer.cell_width *= 2;
        }
    }

    function zoom_centered(out)
    {		
        zoom(out, canvas_width >> 1, canvas_height >> 1);
    }

    /*
     * set zoom to the given level, rounding down
     */
    function zoom_to(level)
    {
        while(drawer.cell_width > level)
        {
            zoom_centered(true);
        }

        while(drawer.cell_width * 2 < level)
        {
            zoom_centered(false);
        }
    }

    function center_view()
    {
        canvas_offset_x = canvas_width >> 1;
        canvas_offset_y = canvas_height >> 1;
    }

    function move(dx, dy)
    {
        canvas_offset_x += dx;
        canvas_offset_y += dy;

        // This code is faster for patterns with a huge density (for instance, spacefiller)
        // It causes jitter for all other patterns though, that's why the above version is preferred

        //context.drawImage(canvas, dx, dy);

        //if(dx < 0)
        //{
        //    redraw_part(node, canvas_width + dx, 0, -dx, canvas_height);
        //}
        //else if(dx > 0)
        //{
        //    redraw_part(node, 0, 0, dx, canvas_height);
        //}

        //if(dy < 0)
        //{
        //    redraw_part(node, 0, canvas_height + dy, canvas_width, -dy);
        //}
        //else if(dy > 0)
        //{
        //    redraw_part(node, 0, 0, canvas_width, dy);
        //}
    }

    function fit_bounds(bounds)
    {
        var width = bounds.right - bounds.left,
            height = bounds.bottom - bounds.top,
            relative_size,
            x,
            y;

        if(isFinite(width) && isFinite(height))
        {
            relative_size = Math.min(
                16, // maximum cell size
                canvas_width / width, // relative width
                canvas_height / height // relative height
            );
            zoom_to(relative_size);

            x = Math.round(canvas_width / 2 - (bounds.left + width / 2) * drawer.cell_width);
            y = Math.round(canvas_height / 2 - (bounds.top + height / 2) * drawer.cell_width);
        }
        else
        {
            // can happen if the pattern is empty or very large
            zoom_to(16);

            x = canvas_width >> 1;
            y = canvas_height >> 1;
        }

        canvas_offset_x = x;
        canvas_offset_y = y;
    }

    function draw_cell(x, y, set)
    {
        var cell_x = x * drawer.cell_width + canvas_offset_x,
            cell_y = y * drawer.cell_width + canvas_offset_y,
            width = Math.ceil(drawer.cell_width) -
                (drawer.cell_width * drawer.border_width | 0);

        if(set) {
            context.fillStyle = drawer.cell_color;
        }
        else {
            context.fillStyle = drawer.background_color;
        }

        context.fillRect(cell_x, cell_y, width, width);
    }

    function pixel2cell(x, y)
    {
        return {
            x : Math.floor((x - canvas_offset_x + drawer.border_width / 2) / drawer.cell_width),
            y : Math.floor((y - canvas_offset_y + drawer.border_width / 2) / drawer.cell_width)
        };
    }

    // #321 or #332211 to { r: 0x33, b: 0x22, g: 0x11 }
    function color2rgb(color)
    {
        if(color.length === 4)
        {
            return {
                r: parseInt(color[1] + color[1], 16),
                g: parseInt(color[2] + color[2], 16),
                b: parseInt(color[3] + color[3], 16)
            };
        }
        else
        {
            return {
                r: parseInt(color.slice(1, 3), 16),
                g: parseInt(color.slice(3, 5), 16),
                b: parseInt(color.slice(5, 7), 16)
            };
        }
    }
}

