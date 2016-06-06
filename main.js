
var canvas;
var gl;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

var img_data=[];
var scales=[];
var img_panels=[];
var color_panels=[];

var orthogonal={
	l: 0,
	r: 1200,
	t: 0,
	b: -600
};

var ImagePanel=function(x,y,w,h,dataID,cID){ 
	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
	this.id=dataID;
	this.cindex=cID;
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
				//console.log(imageVertices.length);
				//console.log(imageVertices[imageVertices.length-3]);
				//console.log(imageVertices[imageVertices.length-2]);
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

	  canvas = document.getElementById("glcanvas");

	  initWebGL(canvas);      // Initialize the GL context

	  // Only continue if WebGL is available and working

	  if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		// Initialize the shaders; this is where all the lighting for the
		// vertices and so forth is established.

		initShaders();

		initShape();
		
		// Set up to draw the scene periodically.
		//setInterval(drawScene, 15);
		// no need to update screen every 15ms
		//drawScene();
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
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}


//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//this draws a rectangle
	var rectangle=Shape.rectangle;
	rectangle.scale(100,100);
	rectangle.move(300,300,0.5);
	rectangle.changeColor(0.5,0.5,0.5);
	rectangle.draw();
	
	var l=img_panels.length;
	if(l>0){
		//this draws the image
		img_panels[l-1].changeColor(0);//changeColor(id) here takes the index of the colormap in scales[]
		img_panels[l-1].scale(img_data[0].w, img_data[0].h);//can change the dimension
		img_panels[l-1].move(100,150,0); //you can change z value, things in the front block things in the back
		img_panels[l-1].draw();
		//draw with another colormap
		img_panels[l-1].changeColor(2);
		img_panels[l-1].move(300,150,1);
		img_panels[l-1].draw();
		
	}
	
	//this draw colormap as thumbnails;
	for(var i=0;i<color_panels.length;i++){
		color_panels[i].scale(50,50);
		color_panels[i].move(200+60*i,50);
		color_panels[i].draw();
	}
	
	//can also make it longer
	color_panels[0].scale(200,50);
	color_panels[0].move(0,350);
	color_panels[0].draw();
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
		if (!file.type.match('plain')) continue;
		var reader = new FileReader();
		reader.onload = function(e2) { // finished reading file data.
			if(type=='img'){
				readTextToImage(e2.target.result);
			}
			else if(type=='color'){
				readTextToScale(e2.target.result);
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
					readOneFileFromServer(directory+lines[i],type);
				}
    },
    error:   function() {
        // An error occurred
		alert("cannot read files from server");
    }
});
}

function readOneFileFromServer(URL,type){
	$.ajax({
    type:    "GET",
    url:     URL,
    success: function(text) {
        // `text` is the file text
		if(type=="scale"){
			readTextToScale(text);
		}
		else if(type=="image"){
			readTextToImage(text);
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

function readTextToImage(text){
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

	//setView();
	drawScene();
}

function readTextToScale(text){
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

	drawScene();
}

function handleImageFileSelect(evt) {
    var files = evt.target.files;
    readFiles(files,"img");
}

function handleColorFileSelect(evt) {
    var files = evt.target.files;
    readFiles(files,"color");
}

