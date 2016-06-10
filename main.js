var version="image hitboxes2"
var canvas;
var gl;
var imageCanvas;
var ctx;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

var mouseDown=false;
var lastMouseX;
var lastMouseY;

var verticesBuffer;
var verticesColorBuffer;

//Color stuffs
var colorMaps = [];//2d array of objects which stores the colors
var iconHeight = 50;
var iconWidth = 50;
var iconX = 600;
var iconY = 50;
var imgIconX=600;
var imgIconY=600;
var receiveX = 50;
var receiveY = 150;
var receiveDelta = 325;
var dragIcon=-1;
var imgIndex = 0;
var mapCIndices = [0,1];
var setColorHeight = [0,0];
var iconViewOffset = 0;
var iconViewWidth = 400;
var iconViewHeight = 70;
var scaleWidth = 400;
var scaleHeight = 100;
var markerLocs = [] //2d array which contains the marker locations in color height
var dragMarker = -1;

var img_data=[];
var scales=[];
var img_panels=[];
var color_panels=[];
var colormapFileNames=[];
var imgFileNames=[];

var textCanvas = document.getElementById("text");
var ctx2 = textCanvas.getContext("2d");

var targ = document.getElementById("imageCanvas");
targ.width="50";
targ.height="50";
console.log("target:"+targ);

var orthogonal={
	l: 0,
	r: 1200,
	t: 0,
	b: -700
};

var viewports=[];


var Viewport=function(x,y,w,h){
	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
	this.self=this;
	this.clear=function(){
		clearRectangle(self.x,self.y,self.w,self.h);
	};
};

var ImagePanel=function(x,y,w,h,dataID,cID){ 
	this.x=x;
	this.y=y;
	this.z=0;
	this.w=w;
	this.h=h;
	this.id=dataID;
	this.cindex=cID;
	//this.viewInfo={w:img_data[id].width, h:img_data[id].height,};
	this.verticesBuffer=gl.createBuffer();
	this.verticesColorBuffer=gl.createBuffer();
	var self=this;
	this.scale=function(w,h){
		self.w=w;
		self.h=h;
	};
	this.move=function(x,y,z){
				self.x=x;
				self.y=-y;
				self.z=-z||0;
				};
	this.changeColor=function(cID){
				self.cindex=cID;
				self.createImageColors(cID);
		};
	this.createImageColors=function(cID){
		var imageColors=[];
		var imageWidth= img_data[self.id].w;
		var imageHeight=img_data[self.id].h;
		var image2DArray=img_data[self.id].data;
		var min=0;
		var max=1;
		if(cID!=null){
			var len=scales[cID].length;
			for(var i=0;i<imageHeight;i++){
				for(var j=0; j<imageWidth; j++){
					var color=(image2DArray[imageWidth*i+j]-min)/(max-min);
					var colorIndex=Math.round((len-1)*color);
					for(var k=0;k<4;k++){
						imageColors.push(scales[cID][colorIndex].r/255);
						imageColors.push(scales[cID][colorIndex].g/255);
						imageColors.push(scales[cID][colorIndex].b/255);
						imageColors.push(1);
					}
				}
			}
		}
		else{
			for(var i=0;i<imageHeight;i++){
				for(var j=0; j<imageWidth; j++){
					var color=(image2DArray[imageWidth*i+j]-min)/(max-min);
					for(var k=0;k<4;k++){
						imageColors.push(color);
						imageColors.push(color);
						imageColors.push(color);
						imageColors.push(1);
					}
				}
			}	
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageColors), gl.STATIC_DRAW);
	};
	this.createImageVertices=
		function(dID){
				var imageVertices=[];
				var imageWidth= img_data[dID].w;
				var imageHeight=img_data[dID].h;
				var pixelW=1/imageWidth;
				var pixelH=1/imageHeight;
				for(var i=0;i>-imageHeight;i--){
					for(var j=0; j<imageWidth; j++){
						imageVertices.push(j*pixelW);
						imageVertices.push(i*pixelH);
						imageVertices.push(0);
						
						imageVertices.push((j+1)*pixelW);
						imageVertices.push(i*pixelH);
						imageVertices.push(0);
						
						imageVertices.push((j+1)*pixelW);
						imageVertices.push((i-1)*pixelH);
						imageVertices.push(0);
						
						imageVertices.push(j*pixelW);
						imageVertices.push((i-1)*pixelH);
						imageVertices.push(0);
				
					}
				}

				gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);

				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(imageVertices), gl.STATIC_DRAW);
		};
	this.createImageVertices(this.id);
	this.createImageColors(this.cindex);
	
	this.draw= 
		function(){
			perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
			
			loadIdentity();	
			mvPushMatrix();
			mvTranslate([self.x, self.y, self.z-1.0]);
			mvScale([self.w,self.h,1]);
			gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
			gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
			gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

			setMatrixUniforms();
			
			var len=img_data[self.id].data.length;
			for(var i=0;i<len;i++){
				gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4);
			}
			mvPopMatrix();
		};
	this.drawInViewport=function(vID){
		var viewp=viewports[vID];
		viewp.clear();
		gl.viewport(viewp.x, viewp.y, viewp.w, viewp.h);
		var tempOrtho=orthogonal;
		orthogonal={l:0, r:viewp.w, b:-viewp.h, t:0};
		self.draw();
		orthogonal=tempOrtho;
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
};

var ColorPanel= function(x,y,w,h,cID){ 
	this.x=x;
	this.y=y;
	this.z=0;
	this.w=w;
	this.h=h;
	this.cindex=cID;
	this.verticesBuffer=gl.createBuffer();
	this.verticesColorBuffer=gl.createBuffer();
	var self=this;
	this.move=function(x,y,z){
				self.x=x;
				self.y=-y;
				self.z=-z||0;
				};
	this.scale=function(w,h){
		self.w=w;
		self.h=h;
	};
	this.create= 
	function(id){//(x,y) top-left coordinate, width, height, index of scale
		var colorScaleVertices=[];
		var colorScaleColors=[];
		var len=scales[id].length;
		var thickness=1/len;
		//build vertices
		//console.log(thickness);
		for(var i=0;i<len;i++){
			colorScaleVertices.push(i*thickness);
			colorScaleVertices.push(0);
			colorScaleVertices.push(0);
			
			colorScaleVertices.push(i*thickness);
			colorScaleVertices.push(-1);
			colorScaleVertices.push(0);
			
			colorScaleVertices.push((i+1)*thickness);
			colorScaleVertices.push(0);
			colorScaleVertices.push(0);
			
			colorScaleVertices.push((i+1)*thickness);
			colorScaleVertices.push(-1);
			colorScaleVertices.push(0);

		}
		//build colors
		for(var i=0;i<len;i++){
			for(var k=0;k<4;k++){
				colorScaleColors.push(scales[id][i].r/255);
				colorScaleColors.push(scales[id][i].g/255);
				colorScaleColors.push(scales[id][i].b/255);
				colorScaleColors.push(1);
			}
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorScaleVertices), gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorScaleColors), gl.STATIC_DRAW);
		
	};
	this.create(cID);
	this.draw=function(){
		var len=scales[cID].length;
		perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
		
		
		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		for(var i=0;i<len;i++){
			gl.drawArrays(gl.TRIANGLE_STRIP, i*4, 4);
		}
		mvPopMatrix();
	};
	
};


var Rectangle= function(){
	this.x = 0;
	this.y = 0;
	this.w = 0;
	this.h = 0;
	this.verticesBuffer = gl.createBuffer();
	this.verticesColorBuffer = gl.createBuffer();
	var self=this;
	this.scale=function(w,h){
		self.w=w;
		self.h=h;
	};
	this.move=function(x,y,z){
		self.x=x;
		self.y=-y;
		self.z=-z||0;
	};
	
	gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0,	0,-1,0,	1,0,0, 1,-1,0]), gl.STATIC_DRAW);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,1,1,	1,1,1,1, 1,1,1,1,	1,1,1,1]), gl.STATIC_DRAW);

	this.changeColor= function(r,b,g,a){
		var a= a||1;
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([r,b,g,a,	r,b,g,a, r,b,g,a,	r,b,g,a]), gl.STATIC_DRAW);
	};
	this.draw= function(){
		perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
		
		
		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
};

var Shape={};
function start() {
	console.log("version:"+version);
	  canvas = document.getElementById("glcanvas");

	  initWebGL(canvas);      // Initialize the GL context

	  // Only continue if WebGL is available and working

	  if (gl) {
	  
		document.onmousedown = handleMouseDown;
		document.onmouseup = handleMouseUp;
		document.onmousemove = 	handleMouseMove;
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		// Initialize the shaders; this is where all the lighting for the
		// vertices and so forth is established.

		initBuffers();
		initMarkers();
		
		initShaders();
		initViewport();
		initShape();
		
		// Set up to draw the scene periodically.
		//setInterval(drawScene, 15);
		// no need to update screen every 15ms
		//drawScene();
	  }
		imageCanvas=document.getElementById("imageCanvas");
		ctx=imageCanvas.getContext("2d");
}

function initViewport(){
	viewports.push(	new Viewport(canvas.width/2,150,canvas.width/4,canvas.width/4));
	viewports.push(	new Viewport(canvas.width*0.75,150,canvas.width/4,canvas.width/4));
}

function initBuffers(){
	verticesBuffer = gl.createBuffer();
	verticesColorBuffer = gl.createBuffer();
}

function initMarkers(){
	for(var i=0;i<mapCIndices.length;i++){
		markerLocs[i] = [.2,.4,.6,.8];
	}
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl",{preserveDrawingBuffer: true});
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

function testImageIconHit(mouseX,mouseY){
	//First test y value
	if(mouseY<imgIconY+10||mouseY>imgIconY+10+iconHeight){
		return -1;
	}
	//Test x values
	for(var i=0;i<img_data.length;i++){
		if(mouseX>imgIconX+10+i*(iconWidth+10)&&mouseX<imgIconX+10+iconWidth+i*(iconWidth+10)){
			return i+10000;
		}
	}
	return -1;
}

//Returns the index of the marker which is clicked on, returns -1 if none
function testMarkerHit(mouseX,mouseY){
	//Find which scale the click is on
	var scale=-1;
	for(var i=0;i<mapCIndices.length;i++){
		if(mouseY>receiveY+scaleHeight/2+receiveDelta*i&&mouseY<receiveY+scaleHeight+receiveDelta*i){
			scale=i;
			break;
		}
	}
	if(scale==-1){
		return -1;
	}
	for(var i=0;i<markerLocs[scale].length;i++){
		if(mouseX>1.0*scaleWidth*markerLocs[scale][i]-4+receiveX&&mouseX<1.0*scaleWidth*markerLocs[scale][i]+4+receiveX){
			return scale*4+i;
		}
	}
	return -1;
}

//Checks if the set color should be changed based on the click, returns if the scene should be update
function checkSetColor(mouseX,mouseY){
	for(var i=0;i<mapCIndices.length;i++){
		var tempHeight = testColorMapHit(mouseX,mouseY,i);
		if(tempHeight!=-1){
			setColorHeight[i]=tempHeight;
			return true;
		}
	}
	return false;
}

//Returns the color height that was clicked, otherwise returns -1
function testColorMapHit(mouseX,mouseY,rindex){
	//Check if the click is within the bounds of the color map
	if(mouseX<receiveX||mouseX>=receiveX+scaleWidth){
		return -1;
	}
	if(mouseY<receiveY+receiveDelta*rindex||mouseY>receiveY+receiveDelta*rindex+scaleHeight){
		return -1;
	}
	return 1.0*(mouseX-receiveX)/scaleWidth;
}

function testIconViewHit(mouseX,mouseY){
	if(mouseX>iconX&&mouseX<iconX+iconViewWidth){
		if(mouseY>iconY&&mouseY<iconY+iconViewHeight){
			return true;
		}
	}
	return false;
}

//Returns the index of the receiver at the coords or -1 if there is no receiver at location
function testreceiverHit(mouseX,mouseY){
	//Receivers will always be in the same x value
	if(mouseX<receiveX-iconWidth/2||mouseX>receiveX+scaleWidth+iconWidth/2){
		return -1;
	}
	//Test y values
	for(var i=0;i<mapCIndices.length;i++){
		if(mouseY>receiveY+i*receiveDelta-iconHeight/2&&mouseY<receiveY+scaleHeight+i*receiveDelta+iconHeight/2){
			return i;
		}
	}
}

//Returns which index of the color map the icon represents or -1 if no icon was hit
function testIconHit(mouseX,mouseY){
	//First test y value
	if(mouseY<iconY+10||mouseY>iconY+10+iconHeight){
		return -1;
	}
	//Test x values
	for(var i=0;i<scales.length;i++){
		if(mouseX>iconX+10+i*(iconWidth+10)-iconViewOffset&&mouseX<iconX+10+iconWidth+i*(iconWidth+10)-iconViewOffset){
			return i;
		}
	}
	return -1;
}
//Gets the color at the specified "height" assuming first color in a map is 0.0 and last color is 1.0
function getColorHeight(cindex,height){
	if(height>=1.0||height<0.0){
		console.log("Warning: Attempted to get invalid color height("+height+").");
		return {'R' : 0,'G' : 0,'B' : 0};
	}
	if(scales[cindex]==null){
		console.log("Color Height debug:"+cindex+","+scales[cindex]);
	}
	var index=Math.floor(1.0*(scales[cindex].length)*height);
	return scales[cindex][index];
}

function getImageIconxy(iindex){
	iindex = iindex-10000;
	var tempx=imgIconX+(iconWidth+10)*iindex+10;
	var tempy=imgIconY+10;
	return [tempx,tempy];
}

function getIconxy(cindex){
	var tempx=iconX+(iconWidth+10)*cindex+10-iconViewOffset;
	var tempy=iconY+10;
	return [tempx,tempy];
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
	  y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
	};
}

function handleMouseDown(event){
	// assign default values for top and left properties
	if(!targ.style.left) { targ.style.left='0px'};
	if (!targ.style.top) { targ.style.top='0px'};
	if(mouseDown){
		return;
	}
	
	mouseDown=true;
	//Get the mouse x and y
	var mouse = getMousePos(canvas, event);
	//Test if the icon view box was hit
	if(testIconViewHit(mouse.x,mouse.y)){
		
		dragIcon=testIconHit(mouse.x,mouse.y);
			if(dragIcon==-1){
				dragIcon=-2;
			}
	}
	
	if(dragIcon==-1){
		dragIcon = testImageIconHit(mouse.x,mouse.y);
	}
	
	dragMarker=testMarkerHit(mouse.x,mouse.y);
	
	//Only check setting the color if the markers did not get hit
	if(dragMarker==-1&&checkSetColor(mouse.x,mouse.y)){
		drawGraphs();
	}
	
	if(dragIcon>=0){
		var tempxy;
		if(dragIcon<10000){
			tempxy=getIconxy(dragIcon);
		}
		else{
			tempxy=getImageIconxy(dragIcon);
		}
		createImage(tempxy[0],tempxy[1],iconWidth,iconHeight);
		targ.style.left=mouse.x-iconWidth/2+'px';
		targ.style.top=mouse.y-iconHeight/2+'px';
	}
	console.log(dragIcon);
	
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;

}


//Called when the mouse is released
function handleMouseUp(event){
	var mouse = getMousePos(canvas, event);
	mouseDown = false;
	if(dragIcon>=0&&dragIcon<10000){
		var receiveIndex =  testreceiverHit(mouse.x,mouse.y);
		if(receiveIndex!=-1){
			mapCIndices[receiveIndex]=dragIcon;
			drawScene();
		}
	}
	if(dragIcon>=10000){
		imgIndex = dragIcon-10000;
	}
	dragIcon=-1;
	dragMarker=-1;
	clearDrag();
	
}

//Called when the mouse moves
function handleMouseMove(event){
	var mouse = getMousePos(canvas, event);
	updateFilenameIndicator(mouse.x,mouse.y);
	if(dragIcon==-1&&dragMarker==-1){
		return;
	}
	if(dragIcon>=0){
		targ.style.left=mouse.x-iconWidth/2+'px';
		targ.style.top=mouse.y-iconHeight/2+'px';
	}
	
	
	if(dragIcon==-2&&iconViewWidth<scales.length*60+10){
		updateIconViewOffset(mouse.x,mouse.y);
		drawColorThumbnails();
	}
	
	if(dragMarker!=-1){
		updateMarkerLoc(mouse.x,mouse.y);
		drawPanels();
		drawMarkers();
		drawInfoBoxes();
	}
	
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;
	return false;
}

function updateFilenameIndicator(mouseX,mouseY){
	//Clear the text area where the fileName will go
	ctx2.clearRect(iconX-10,iconY-40,600, 40);
	
	//Check what fileIcon the mouse is over
	var hit=testIconHit(mouseX,mouseY);
	
	if(hit!=-1){
		drawText(colormapFileNames[hit],iconX,iconY-10);
	}
}

function clearDrag(){
	createImage(0,0,iconWidth,iconHeight);
	targ.style.left='0px';
	targ.style.top='0px';
}

function updateMarkerLoc(mouseX,mouseY){
	var dx=lastMouseX-mouseX;
	var scaleIndex = Math.floor(dragMarker/4);
	var markerIndex = dragMarker%4;
	var tempx = markerLocs[scaleIndex][markerIndex];
	tempx=tempx-dx/scaleWidth;
	
	//Edge checking
	if(tempx<0){
		tempx=0;
	}
	if(tempx>.999){
		tempx=.999;
	}
	//Checking for previous and next markers
	if(markerIndex>0&&tempx<markerLocs[scaleIndex][markerIndex-1]+.01){
		tempx=markerLocs[scaleIndex][markerIndex-1]+.01;
	}
	if(markerIndex<3&&tempx>markerLocs[scaleIndex][markerIndex+1]-.01){
		tempx=markerLocs[scaleIndex][markerIndex+1]-.01;
	}
	markerLocs[scaleIndex][markerIndex]=tempx;
}

function updateIconViewOffset(mouseX,mouseY){
	var dx=lastMouseX-mouseX;
	iconViewOffset = iconViewOffset+dx;
	if(iconViewOffset<0){
		iconViewOffset=0;
	}
	if(0<scales.length*60-iconViewWidth+10&&iconViewOffset>scales.length*60-iconViewWidth+10){
		iconViewOffset=scales.length*60-iconViewWidth+10;
	}
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.
  gl.clearColor(.5, .5, .5, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//this draws a rectangle
	/*
	var rectangle=Shape.rectangle;
	rectangle.scale(100,100);
	rectangle.move(300,300,0.5);
	rectangle.changeColor(0.5,0.5,0.5);
	rectangle.draw();*/
	
	if(img_panels.length!=0){
		var panel = img_panels[imgIndex];
		//this draws the image
		panel.changeColor(mapCIndices[0]);//changeColor(id) here takes the index of the colormap in scales[]
		panel.scale(img_data[imgIndex].w, img_data[imgIndex].h);//can change the dimension
		panel.move(600,150,0); //you can change z value, things in the front block things in the back
		panel.draw();
		//draw with another colormap
		panel.changeColor(mapCIndices[1]);
		panel.move(850,150,1);
		panel.draw();
		
		for(var i=0;i<img_panels.length;i++){
			img_panels[i].changeColor(null);
			img_panels[i].scale(iconWidth, iconHeight);
			img_panels[i].move(i*(iconWidth+10)+imgIconX+10,imgIconY+10,0);
			img_panels[i].draw();
		}
	}
	
	drawColorThumbnails();
	//drawReceiveThumbnails();
	drawPanels();
	drawGraphs();
	drawMarkers();
	drawInfoBoxes();
	drawText();
	//drawLine(0,0,400,400,{r:100,g:100,b:100});
}

function drawLine(x,y,x2,y2,color){
	var thickness=1;
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x-thickness,-y,-1,	x+thickness,-y,-1,	x2+thickness,-y2,-1, x2-thickness,-y2,-1]), gl.STATIC_DRAW);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([color.r/255,color.g/255,color.b/255,1,	color.r/255,color.g/255,color.b/255,1, color.r/255,color.g/255,color.b/255,1,	color.r/255,color.g/255,color.b/255,1]), gl.STATIC_DRAW);

	perspectiveMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
	
	
	loadIdentity();
	mvPushMatrix();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	mvPopMatrix();
}


function drawInfoBoxes(){

	clearText();
	//Clear the area the lines go in
	clearRectangle(receiveX-5,receiveY+scaleHeight+30,scaleWidth+10,30);
	drawInfoBox(scaleWidth*.025+receiveX,receiveY+scaleHeight+30,0,0,1);
	drawInfoBox(scaleWidth*.525+receiveX,receiveY+scaleHeight+30,0,2,3);
	drawText(colormapFileNames[mapCIndices[0]],receiveX+10,receiveY+scaleHeight/4);
	
	//Clear the area the lines go in
	clearRectangle(receiveX-5,receiveY+scaleHeight+30+receiveDelta,scaleWidth+10,30);
	drawInfoBox(scaleWidth*.025+receiveX,receiveY+scaleHeight+30+receiveDelta,1,0,1);
	drawInfoBox(scaleWidth*.525+receiveX,receiveY+scaleHeight+30+receiveDelta,1,2,3);
	drawText(colormapFileNames[mapCIndices[1]],receiveX+10,receiveY+receiveDelta+scaleHeight/4);
	
	
}

function drawInfoBox(x,y,graphIndex, marker1, marker2){
	if(mapCIndices[graphIndex]>=scales.length){
		return;
	}
	var rectangle=Shape.rectangle;
	var width = scaleWidth*.45;
	var height = 75;
	rectangle.scale(width,height);
	rectangle.move(x,y);
	rectangle.changeColor(1,1,1);
	rectangle.draw();
	
	//Draw lines to the markers
	var marker1Loc = markerLocs[graphIndex][marker1];
	var marker2Loc = markerLocs[graphIndex][marker2];
	var color1 = getColorHeight(mapCIndices[graphIndex],marker1Loc);
	var color2 =getColorHeight(mapCIndices[graphIndex],marker2Loc)
	
	drawLine(receiveX+scaleWidth*marker1Loc,receiveY+scaleHeight+receiveDelta*graphIndex,x,y,color1);
	drawLine(receiveX+scaleWidth*marker2Loc,receiveY+scaleHeight+receiveDelta*graphIndex,x+width,y,color2);
	
	//Draw color boxes
	rectangle.scale(width/2-2,6);
	rectangle.changeColor(color1.r/255,color1.g/255,color1.b/255);
	rectangle.move(x+2,y+2);
	rectangle.draw();
	rectangle.changeColor(color2.r/255,color2.g/255,color2.b/255);
	rectangle.move(x+width/2,y+2);
	rectangle.draw();
	//write rgb values
	drawText(Math.round(color1.r)+" "+Math.round(color1.g)+" "+Math.round(color1.b),x+2,y+25);
	drawText(Math.round(color2.r)+" "+Math.round(color2.g)+" "+Math.round(color2.b),x+width/2+2,y+25);
	
	//write lab values
	var lab1=rgb_to_lab({'R':color1.r, 'G':color1.g, 'B':color1.b});
	var lab2=rgb_to_lab({'R':color2.r, 'G':color2.g, 'B':color2.b});
	drawText(Math.round(lab1.L)+" "+Math.round(lab1.a)+" "+Math.round(lab1.b),x+2,y+45);
	drawText(Math.round(lab2.L)+" "+Math.round(lab2.a)+" "+Math.round(lab2.b),x+width/2+2,y+45);
	
	//write ciede difference
	var deltaE=ciede2000(lab1,lab2);
	drawText("CIEDE2000: "+deltaE.toPrecision(9),x+2,y+65);

}

function drawMarkers(){
	for(var i=0;i<mapCIndices.length;i++){
		for(var j=0;j<markerLocs[i].length;j++){
			drawMarker(i,markerLocs[i][j]);
		}
	}
}

function drawMarker(graphIndex,height){
	//Height is the color that is to be seen
	var tempx = receiveX+Math.floor(scaleWidth*height);
	var tempy = receiveY+scaleHeight/2+receiveDelta*graphIndex;	
	
	var rectangle=Shape.rectangle;
	rectangle.scale(3,scaleHeight/2);
	rectangle.move(tempx-3,tempy);
	rectangle.changeColor(.3,.3,.3);
	rectangle.draw();
	rectangle.move(tempx+1,tempy);
	rectangle.draw();
}

function clearText(){
	ctx2.clearRect(0,0,ctx2.canvas.width, ctx2.canvas.height);
}

function drawText(string,x,y){
	ctx2.font = "15px serif";
	ctx2.fillText(string,x,y);
}

function clearRectangle(x,y,w,h){
	gl.enable(gl.SCISSOR_TEST);
	
	gl.scissor(x,700-y,w,h);
	
	gl.clearColor(0.5,0.5,0.5,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.disable(gl.SCISSOR_TEST);

}

function drawGraphs(){
	for(var i=0;i<mapCIndices.length;i++){
		var colorPanel=color_panels[mapCIndices[i]];
		if(colorPanel==null){
			continue;
		}
		clearRectangle(receiveX,receiveY+receiveDelta*i,scaleWidth,120);
		drawGraph(receiveX,receiveY+receiveDelta*i-scaleHeight*2,scaleWidth,scaleHeight*2,mapCIndices[i],setColorHeight[i]);//x,y,w,h,colorID, relative position(0 to 1)
	}
}

function drawPanels(){
	
	for(var i=0;i<mapCIndices.length;i++){
		var colorPanel=color_panels[mapCIndices[i]];
		if(colorPanel==null){
			continue;
		}
		clearRectangle(receiveX-10,receiveY+receiveDelta*i+scaleHeight,scaleWidth+20,scaleHeight);
		colorPanel.scale(scaleWidth,scaleHeight);
		colorPanel.move(receiveX,receiveY+receiveDelta*i);
		colorPanel.draw();
	}
}

function drawReceiveThumbnails(){
	for(var i=0;i<mapCIndices.length;i++){
		var tempy=receiveY+receiveDelta*i;
		if(mapCIndices[i]<scales.length){
			drawThumbnail(receiveX,tempy,mapCIndices[i]);
		}
	}
}

function drawColorView(){
	var rectangle=Shape.rectangle;
	rectangle.scale(iconViewWidth+6,3);
	rectangle.move(iconX-3,iconY-3,-.5);
	rectangle.changeColor(1.0,0.0,0.0);
	rectangle.draw();
	rectangle.move(iconX-3,iconY+iconViewHeight,-.5);
	rectangle.draw();
	rectangle.scale(3,iconViewHeight+6);
	rectangle.move(iconX-3,iconY-3,-.5);
	rectangle.draw();
	rectangle.move(iconX+iconViewWidth,iconY-3,-.5);
	rectangle.draw();
}

function drawColorThumbnails(){
	
	//Erase the whole of the iconview area
	clearRectangle(iconX,iconY+iconViewHeight,iconViewWidth,iconViewHeight);
	
	//this draw colormap as thumbnails;
	for(var i=0;i<color_panels.length;i++){
		if((iconWidth+10)*i+10-iconViewOffset+iconWidth<0||(iconWidth+10)*i+10-iconViewOffset>iconViewWidth){
			continue;
		}
		drawThumbnail(iconX+(iconWidth+10)*i+10-iconViewOffset,iconY+10,i);
	}
	
	//Draw the borders
	drawColorView();
	
	//Clear the edges
	clearRectangle(iconX-6-iconWidth,iconY+iconViewHeight,iconWidth+3,iconViewHeight);
	clearRectangle(iconX+3+iconViewWidth,iconY+iconViewHeight,iconWidth+3,iconViewHeight);
}

function drawThumbnail(x,y,cindex){
	var rectangle=Shape.rectangle;
	rectangle.scale(1,iconHeight);
	var increment = 1.0/iconWidth;

	for(var i=0;i<iconWidth;i++){
		rectangle.move(x+i,y,.5);
		var color=getColorHeight(cindex,increment*i);
		rectangle.changeColor(color.r/255.0,color.g/255.0,color.b/255.0);
		rectangle.draw();
	}
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  gl.shaderSource(shader, theSource);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initShape(){
	Shape.rectangle= new Rectangle();
}

//set the orthogonal view to view the entire image
function setView(l,r,b,t){
	orthogonal.l=l;
	orthogonal.r=r;
	orthogonal.b=b;
	orthogonal.t=t;
}


//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}
function mvScale(v){
	multMatrix(Matrix.Diagonal([v[0], v[1], v[2],1]).ensure4x4());
}


var mvMatrixStack = [];
function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function setIdentityUniforms(){
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(Matrix.I(4).flatten()));

	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(Matrix.I(4).flatten()));
}
//
//handle the File drop event and selecting files
//

function addEventHandler(obj, evt, handler) {
    if(obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if(obj.attachEvent) {
        // IE method.
        obj.attachEvent('on'+evt, handler);
    } else {
        // Old school method.
        obj['on'+evt] = handler;
    }
}

$(document).on('load',FileListenerInit());
function FileListenerInit(){
	if(window.FileReader) {
		addEventHandler(window, 'load', function() {
			var drop1  = document.getElementById('drop1');
			var drop2 = document.getElementById('drop2');
			var select1 = document.getElementById('selector1');
			var select2 = document.getElementById('selector2');
			
			drop1.style.left= imgIconX-10+'px';
			drop1.style.top= imgIconY-10+"px";
			drop1.style.width=iconViewWidth+"px";
			drop1.style.height=iconViewHeight+"px";
			drop1.style.position= 'absolute';
			
			drop2.style.left= iconX-3+'px';
			drop2.style.top= iconY-3+"px";
			drop2.style.width=iconViewWidth+"px";
			drop2.style.height=iconViewHeight+"px";
			drop2.style.position= 'absolute';
			
			function cancel(e) {
			   e.preventDefault(); 
			}
			
			function readDroppedFiles(e,type) {
				e = e || window.event;
				cancel(e);
				e.stopPropagation();
				
				var files = e.dataTransfer.files; // Array of all files
				readFiles(files,type);
			}
			
			addEventHandler(drop1, 'dragover', cancel);
			addEventHandler(drop1, 'dragenter', cancel);
			addEventHandler(drop1,'drop', function(e){readDroppedFiles(e,'img');});
			addEventHandler(drop2, 'dragover', cancel);
			addEventHandler(drop2, 'dragenter', cancel);
			addEventHandler(drop2,'drop', function(e){readDroppedFiles(e,'color');});
			addEventHandler(select1,'change', handleImageFileSelect);
			addEventHandler(select2,'change', handleColorFileSelect);
		});
	} else {
	  alert('Your browser does not support the HTML5 FileReader.');
	}
}

function readFiles(files,type){
	for (var i=0, file; file=files[i]; i++) {
		//if (!file.type.match('plain')) continue;
		var reader = new FileReader();
		reader.file=file;
		reader.onload = function(e2) { // finished reading file data.
			if(type=='img'){
				readTextToImage(e2.target.result,this.file.name);
			}
			else if(type=='color'){
				readTextToScale(e2.target.result,this.file.name);
			}
		}
		reader.readAsText(file); // start reading the file data.
	}
}

$(document).on("load",readFilesFromServer("./data/colorscale/","scale"));

function readFilesFromServer(directory,type){//type=scale, image
	$.ajax({
    type:    "GET",
    url:     directory+"index.txt",
    success: function(text) {		
            var lines=text.split('\n');
			if(lines[lines.length-1]=="")lines.pop();
				for(var i=0;i<lines.length;i++) {
					readOneFileFromServer(directory,lines[i],type);
				}
    },
    error:   function() {
        // An error occurred
		alert("cannot read files from server");
    }
});
}

function readOneFileFromServer(directory,filename,type){
	$.ajax({
    type:    "GET",
    url:     directory+filename,
    success: function(text) {
        // `text` is the file text
		if(type=="scale"){
			readTextToScale(text,filename);
		}
		else if(type=="image"){
			readTextToImage(text,filename);
		}
		else{
			console.log("file does not match:");
			console.log(text);
		}
    },
    error:   function() {
        // An error occurred
		alert("cannot read files from server");
    }
});
}

function readTextToImage(text,filename){
	var image2DArray=[];
	var imageHeight= undefined;
	var imageWidth= undefined;

	//parse the data into the array
	var lines=text.split('\n');
	if(lines[lines.length-1]=="")lines.pop();
	imageHeight=lines.length;
	for(var i=0;i<lines.length;i++) {
		var values=lines[i].split(' ');
		if(values[values.length-1]=="\r")values.pop();
		if(!imageWidth){
			imageWidth = values.length;
		}else if(imageWidth!=values.length){
			alert('error reading the file. line:'+i+ ", num:"+values.length+", value=("+values[0]+")");
			return;
		}
		for(var j=0; j<values.length; j++){
			if(values[j]) image2DArray.push(Number(values[j]));
		}
	}
	var imgData ={
		w: imageWidth,
		h: imageHeight,
		data: image2DArray
	};
	img_data.push(imgData);
	img_panels.push(new ImagePanel(0,0,1,1,img_data.length-1,null));
	imgFileNames.push(filename);
	//setView();
	drawScene();
	//console.log(imgFileNames);
}

function readTextToScale(text,filename){
	var scale=[];
	var lines=text.split('\n');
	if(lines[lines.length-1]=="")lines.pop();
	for(var i=0; i<lines.length;i++){
		var color=lines[i].split(" ");
		var rgb={
			r: Number(color[0]),
			g: Number(color[1]),
			b: Number(color[2])
		};
		scale.push(rgb);
	}
	scales.push(scale);
	
	color_panels.push(new ColorPanel(0,0,50,50,scales.length-1));
	colormapFileNames.push(filename);
	drawScene();
	//console.log(colormapFileNames);
	//computeDeltaE(scales.length-1);
}

function handleImageFileSelect(evt) {
    var files = evt.target.files;
    readFiles(files,"img");
}

function handleColorFileSelect(evt) {
    var files = evt.target.files;
    readFiles(files,"color");
}


function createImage(x,y,w,h){
	var myImageData=ctx.createImageData(w,h); //uint8clampedarray
	var pixelData = new Uint8Array(w*h*4);//unit8array
	gl.readPixels(x, canvas.height-y-h, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
	myImageData.data.set(pixelData);
	ctx.putImageData(myImageData,0,0);
}


function drawGraph(x,y,w,h,cID,relative){
	var scale=scales[cID];
	var len=scale.length;
	var rect=Shape.rectangle;
	var cref=getColorHeight(cID,relative);
	var labref=rgb_to_lab({'R':cref.r, 'G':cref.g, 'B':cref.b});
	
	rect.changeColor(cref.r/255.0,cref.g/255.0,cref.b/255.0);
	for(var i=0; i<len; i++){
		var barWidth=w/len;
		var color=getColorHeight(cID,i/len);
		var lab=rgb_to_lab({'R':color.r, 'G':color.g, 'B':color.b});
		var barHeight=ciede2000(labref,lab);
		rect.scale(barWidth,barHeight);
		rect.move(x+(barWidth*i),y+h-barHeight);
		rect.draw();
	}
}

function computeDeltaE(cID){
	var outputText="";
	var scale=scales[cID];
	for(var i=0;i<scale.length;i++){
		var rgb1=scale[i-1];
		if(rgb1)
			var lab1=rgb_to_lab({'R':rgb1.r, 'G':rgb1.g, 'B':rgb1.b});
		var rgb2=scale[i];
		var lab2=rgb_to_lab({'R':rgb2.r, 'G':rgb2.g, 'B':rgb2.b});
		if(lab1&&lab2)
			var deltaE=ciede2000(lab1,lab2);
		outputText=outputText+rgb2.r+" "+rgb2.g+" "+rgb2.b+" "+"deltaE = "+deltaE+"\n";
	}
	download(outputText, colormapFileNames[cID]+"-deltaE.txt", 'text/plain');
}

function download(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

function linearizeLightness(cID){
	var newScale=[];
	var len=scales[cID].length;
	for(var i=0;i<len;i++){
		var newL=100*i/(len-1);
		var oldrgb=scales[cID][i];
		var oldLab=rgb_to_lab({'R':oldrgb.r, 'G':oldrgb.g, 'B':oldrgb.b});
		var newLab={L: newL, a: oldLab.a, b: oldLab.b};
		var newrgb=lab_to_rgb(newLab);
		newScale.push({r: newrgb.R, g: newrgb.G, b: newrgb.B});
	}
	scales.push(newScale);
	color_panels.push(new ColorPanel(0,0,50,50,scales.length-1));
	colormapFileNames.push(colormapFileNames[cID]+"(Adjusted Linear Lightness)");
	drawScene();
}