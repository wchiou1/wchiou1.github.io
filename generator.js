var version="Testing init2"

var canvas = document.getElementById("glcanvas");
var gl;
shaderProgram={};
attributes={};
uniforms={};
var imageCanvas;
var ctx;
var lastShader=null;

var colorMaps = [];//2d array of objects which stores the colors
var color_panels=[];
var iconViewWidth = 70;
var iconViewHeight = 400;
var iconHeight = 50;
var iconWidth = 50;
var iconViewOffset = 0;
var scales=[];
var Shape={};
var colormapFileNames=[];
var colorIconsData=[];
var iconX = 50;
var iconY = 150;
var verticesBuffer;
var verticesColorBuffer;

var min_width=512;
var min_height=512;
var orthogonal={
	l: 0,
	r: 1200,
	t: 0,
	b: -700
};
var orthoMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);

var ColorPanel= function(x,y,w,h,cID){
	this.x=x;
	this.y=y;
	this.z=0;
	this.w=w;
	this.h=h;
	this.cindex=cID;
	this.verticesBuffer=Shape.rectangle.verticesBuffer;
	this.verticesTexCoordBuffer=Shape.rectangle.verticesTexCoordBuffer;
	this.texture=gl.createTexture();
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
	
	function flatten(scale){
		var array=[];
		for(var i=0;i<scale.length;i++){
			array.push(Math.round(scale[i].r*255));
			array.push(Math.round(scale[i].g*255));
			array.push(Math.round(scale[i].b*255));
			array.push(255);
		}
		return new Uint8Array(array);
	}
	
	this.create= 
	function(id){
		gl.bindTexture(gl.TEXTURE_2D, self.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scales[id].length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,flatten(scales[id]));
		setTexParameter();
	};
	this.create(cID);
	this.draw=function(inverted){
		if(lastShader!=="colormapShader"){
			lastShader="colormapShader";
			gl.useProgram(shaderProgram.colormapShader);
			gl.enableVertexAttribArray(attributes.colormapShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.colormapShader.vertexTexCoordAttribute);
		}
			
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(attributes.colormapShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		if(inverted)
			gl.bindBuffer(gl.ARRAY_BUFFER, Shape.rectangle.invertedTexCoordBuffer);
		else
			gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		gl.vertexAttribPointer(attributes.colormapShader.vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
		
		gl.uniform1i(uniforms.colormapShader.uColormapLoc, 0);  
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, self.texture);
		
		perspectiveMatrix = orthoMatrix;

		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);

		setMatrixUniforms(uniforms.colormapShader);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
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
	this.verticesTexCoordBuffer=gl.createBuffer();
	this.invertedTexCoordBuffer=gl.createBuffer();
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
	
	gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 0,0, 1,1, 1,0]), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, self.invertedTexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1, 1,0, 0,1, 0,0]), gl.STATIC_DRAW);

	this.changeColor= function(r,g,b,a){
		if(a==undefined) a=1;
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([r,g,b,a,	r,g,b,a, r,g,b,a,	r,g,b,a]), gl.STATIC_DRAW);
	};
	this.draw= function(){
		if(lastShader!=="simple"){
			lastShader="simple";
			gl.useProgram(shaderProgram.simpleShader);
			gl.enableVertexAttribArray(attributes.simpleShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.simpleShader.vertexColorAttribute);
		}


		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(attributes.simpleShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		gl.vertexAttribPointer(attributes.simpleShader.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
		
		perspectiveMatrix = orthoMatrix;
		
		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);
		
		setMatrixUniforms();
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
	this.drawWithTexture=function(texture){
		if(lastShader!=="colormapShader"){
			lastShader="colormapShader";
			gl.useProgram(shaderProgram.colormapShader);
			gl.enableVertexAttribArray(attributes.colormapShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.colormapShader.vertexTexCoordAttribute);
		}
			
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(attributes.colormapShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		gl.vertexAttribPointer(attributes.colormapShader.vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
		
		gl.uniform1i(uniforms.colormapShader.uColormapLoc, 0);  
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		perspectiveMatrix = orthoMatrix;

		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);

		setMatrixUniforms(uniforms.colormapShader);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
};

function start() {
	console.log("version:"+version);
	
	addEventHandler(window,"resize",on_resize(resize));
	initWebGL(canvas);
	  if (gl) {
		
		document.onmousedown = handleMouseDown;
		document.onmouseup = handleMouseUp;
		document.onmousemove = 	handleMouseMove;
		addEventHandler(document,"mousewheel",MouseWheelHandler);
		// Firefox
		addEventHandler(document,"DOMMouseScroll",MouseWheelHandler);
		
		gl.clearColor(0.5, 0.5, 0.5, 1.0);  
		gl.clearDepth(1.0);
		//gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//initTextureFramebuffer(); //#not ready
		initShaders();
		readFilesOnLoad()
		initShape();
		resize();
		imageCanvas=document.getElementById("imageCanvas");
		ctx=imageCanvas.getContext("2d");
		drawScene();
	  }
}

function clearRectangle(x,y,w,h){
	gl.enable(gl.SCISSOR_TEST);
	
	gl.scissor(x,canvas.height-y,w,h);
	
	gl.clearColor(0.5,0.5,0.5,1.0);
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.disable(gl.SCISSOR_TEST);

}

function setTexParameter(){
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function initShape(){
	Shape.rectangle= new Rectangle();
}

function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl",{preserveDrawingBuffer: true});
  }
  catch(e) {
  }
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}
function initBuffer(){
	verticesBuffer=gl.createBuffer();
	verticesColorBuffer=gl.createBuffer();
}
function initShaders() {
	var simple_vertexShader = getShader(gl, "simple-shader-vs");
	var simple_fragmentShader = getShader(gl, "simple-shader-fs");
	shaderProgram.simpleShader = gl.createProgram();
	gl.attachShader(shaderProgram.simpleShader, simple_vertexShader);
	gl.attachShader(shaderProgram.simpleShader, simple_fragmentShader);
	gl.linkProgram(shaderProgram.simpleShader);
	if (!gl.getProgramParameter(shaderProgram.simpleShader, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " );
	}
	attributes.simpleShader={
		vertexPositionAttribute : gl.getAttribLocation(shaderProgram.simpleShader, "aVertexPosition"),
		vertexColorAttribute : gl.getAttribLocation(shaderProgram.simpleShader, "aVertexColor")
	};
	uniforms.simpleShader={
		pUniform : gl.getUniformLocation(shaderProgram.simpleShader, "uPMatrix"),
		mvUniform : gl.getUniformLocation(shaderProgram.simpleShader, "uMVMatrix")
	};
	
	var colormap_vertexShader = getShader(gl, "colormap-shader-vs");
	var colormap_fragmentShader = getShader(gl, "colormap-shader-fs");
	shaderProgram.colormapShader = gl.createProgram();
	gl.attachShader(shaderProgram.colormapShader, colormap_vertexShader);
	gl.attachShader(shaderProgram.colormapShader, colormap_fragmentShader);
	gl.linkProgram(shaderProgram.colormapShader);
	if (!gl.getProgramParameter(shaderProgram.colormapShader, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: ");
	}
	attributes.colormapShader={
		vertexPositionAttribute : gl.getAttribLocation(shaderProgram.colormapShader, "aVertexPosition"),
		vertexTexCoordAttribute : gl.getAttribLocation(shaderProgram.colormapShader, "aVertexTexCoord")
	};
	uniforms.colormapShader={
		pUniform : gl.getUniformLocation(shaderProgram.colormapShader, "uPMatrix"),
		mvUniform : gl.getUniformLocation(shaderProgram.colormapShader, "uMVMatrix"),
		uColormapLoc : gl.getUniformLocation(shaderProgram.colormapShader, "uColormap")
	};
	
	gl.useProgram(shaderProgram.simpleShader);
	gl.enableVertexAttribArray(attributes.simpleShader.vertexPositionAttribute);
	gl.enableVertexAttribArray(attributes.simpleShader.vertexColorAttribute);
	gl.lineWidth(3);
}

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

//Gets the color at the specified "height" assuming first color in a map is 0.0 and last color is 1.0
function getColorHeight(cindex,height,inverse){
	if(cindex<0||cindex>=scales.length){
		//console.log("Warning: Attempted to get invalid color index("+cindex+").");
		return {'R' : 0,'G' : 0,'B' : 0};
	}
	//if(inverse)
	//	height=1.0-height;
	if(height>=1.0||height<0.0){
		console.log("Warning: Attempted to get invalid color height("+height+").");
		return {'R' : 0,'G' : 0,'B' : 0};
	}
	if(scales[cindex]==null){
		console.log("Color Height debug:"+cindex+","+scales[cindex]);
	}
	var index=Math.floor(1.0*(scales[cindex].length)*height);
	if(inverse)
		index=scales[cindex].length-index-1;
	return scales[cindex][index];
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
	  y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
	};
}

function handleMouseDown(event){
	var mouse=getMousePos(canvas, event);
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;
}


//Called when the mouse is released
function handleMouseUp(event){
	var mouse = getMousePos(canvas, event);

}

//Called when the mouse moves
function handleMouseMove(event){
	var mouse = getMousePos(canvas, event);

}

function MouseWheelHandler(e) {

}
var pMatrix2=makeOrtho(-256,256,-256,256,-10000,10000);
var transform2={
	degx: 0,
	degy: 0,
	scale: 1
};

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

function setMatrixUniforms(shader) {
	if(!shader)
		shader = uniforms.simpleShader;
  gl.uniformMatrix4fv(shader.pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
  gl.uniformMatrix4fv(shader.mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function initT2(){
	transform2.degx=45;
	transform2.degy=45;
	transform2.scale=1;
}

function rotateT2(x,y){
	transform2.degy+=x;
	transform2.degx+=-y;
	if(transform2.degy>=360)
		transform2.degy-=360;
	else if(transform2.degy<= -360)
		transform2.degy+=360;
	if(transform2.degx<-90)
		transform2.degx=-90;
	else if(transform2.degx>90)
		transform2.degx=90;
}
function scaleT2(scalar){
	transform2.scale*=scalar;
}
function drawLabSpace(cid,bufid){
	
	if(cid==null) cid=LabSpaceColor;
	if(bufid==null) bufid=0;
	
	
	var radx = transform2.degx * Math.PI / 180.0;
	var rady = transform2.degy * Math.PI / 180.0;
	var s=transform2.scale;

	var mvMatrix2 = Matrix.I(4).x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1]).ensure4x4());

	gl.uniformMatrix4fv(uniforms.simpleShader.pUniform, false, new Float32Array(pMatrix2.flatten()));
	gl.uniformMatrix4fv(uniforms.simpleShader.mvUniform, false, new Float32Array(mvMatrix2.flatten()));
	
	//draw axes
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-128,0,0,	128,0,0, 0,-50,0,	0,50,0, 0,0,-128, 0,0,128]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(attributes.simpleShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,154.5/255,116.4/255,1,	1,0,124.7/255,1,	0,0,0,1, 1,1,1,1,	0,138.4/255,1,1,	148.6/255,116/255,0,1]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(attributes.simpleShader.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.LINES, 0, 6);
	
	//draw colors
	if(scales[cid]==undefined)return;
	var len=scales[cid].length;
	
	if(tempid[bufid]!=cid){
		tempid[bufid]=cid;
		var scale=scales[cid];
		var list_rgba=[];
		var list_pos=[];
		for(var i=0;i<len;i++){
			var rgb=scale[i];
			list_rgba.push(rgb.r);
			list_rgba.push(rgb.g);
			list_rgba.push(rgb.b);
			list_rgba.push(1);
			var lab=rgb_to_lab({'R':rgb.r*255, 'G':rgb.g*255, 'B':rgb.b*255});
			list_pos.push(lab.a);
			list_pos.push(lab.L-50);
			list_pos.push(lab.b);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer2[bufid]);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(list_pos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer2[bufid]);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(list_rgba), gl.STATIC_DRAW);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer2[bufid]);
	gl.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer2[bufid]);
	gl.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.POINTS, 0, len);
	
}

function drawScene() {
	gl.clearColor(.5, .5, .5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	drawColorThumbnails();
}

function drawColorThumbnails(){
	
	//Erase the whole of the iconview area
	clearRectangle(iconX,iconY+iconViewHeight,iconViewWidth,iconViewHeight);
	
	//this draw colormap as thumbnails;
	for(var i=0;i<color_panels.length;i++){
		if((iconHeight+10)*i+10-iconViewOffset+iconHeight<0||(iconHeight+10)*i+10-iconViewOffset>iconViewHeight){
			continue;
		}
		drawThumbnail(iconX+10,iconY+(iconHeight+10)*i+10-iconViewOffset,i);
	}
	
	//Draw the borders
	drawBorder(iconX,iconY,iconViewWidth,iconViewHeight,{r:.3,g:.3,b:.3});
	
	//Clear the edges
	clearRectangle(iconX,iconY-3,iconViewWidth,iconHeight+3);
	clearRectangle(iconX,iconY+iconViewHeight+iconHeight+5,iconViewWidth,iconHeight+3);
}

function drawThumbnail(x,y,cindex){
	color_panels[cindex].scale(iconWidth,iconHeight);
	color_panels[cindex].move(x,y);
	color_panels[cindex].draw();
}

function drawBorder(x,y,w,h,color){
	var rectangle=Shape.rectangle;
	rectangle.scale(w+6,3);
	rectangle.move(x-3,y-3,-.5);
	rectangle.changeColor(color.r,color.g,color.b);
	rectangle.draw();
	rectangle.move(x-3,y+h,-.5);
	rectangle.draw();
	rectangle.scale(3,h+6);
	rectangle.move(x-3,y-3,-.5);
	rectangle.draw();
	rectangle.move(x+w,y-3,-.5);
	rectangle.draw();
}

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

function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};//http://louisremi.mit-license.org/
function resize(){
	var newwidth = Math.max(min_width,canvas.clientWidth);
	var newheight = Math.max(min_height,canvas.clientHeight);
	if (canvas.width != newwidth || canvas.height != newheight) {
	canvas.width = newwidth;
    canvas.height = newheight;
	gl.viewport(0,0,canvas.width,canvas.height);
	var scaleX=newwidth/min_width;
	var scaleY=newheight/min_height;
	var scaleSquare=Math.min(scaleX,scaleY);
	screenscale=scaleSquare;
	var iconDim=50*scaleSquare;
    iconHeight = iconDim;
    iconWidth = iconDim;
    iconX = 50*scaleSquare;
    iconY = 150*scaleY;
    receiveX = 200*scaleX;
    receiveY = 150*scaleY;
    receiveDelta = 325*scaleY;
    iconViewWidth = 70*scaleSquare;
    iconViewHeight = 400*scaleY;
    resetIconX = 630*scaleX;
    resetIconY = 10*scaleY;
    scaleWidth = 400*scaleSquare;
    scaleHeight = 100*scaleSquare;
	setView(0,canvas.width,-canvas.height,0);
	orthoMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
	initButtons();
	initViewport();
	drawHelpText();
    drawScene();
   }
}

function readFilesOnLoad(){
	readFilesFromServer("./data/colorscale/","scale");
}
function readFilesFromServer(directory,type){//type=scale, image
	$.ajax({
    type:    "GET",
    url:     directory+"start.txt",
    success: function(text) {		
            var lines=text.split('\n');
			if(lines[lines.length-1]==""||lines[lines.length-1]=="/r")lines.pop();
			if(type!="scale"){
				loading+=lines.length;
				updateLoader();
			}
			for(var i=0;i<lines.length;i++) {
				if(lines[i][lines[i].length-1]==""||lines[i][lines[i].length-1]=="\r")
					readOneFileFromServer(directory,lines[i].slice(0,-1),type);
				else
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
			readTextToImage(text,filename,null);
		}
		else if(type=="tubes"){
			readTextToTubes(text,filename);
		}
		else if(type=='data'){
			if(filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2)=="data")//if extension is .data
				readTextToTubes(text,filename);
			else
				readTextToImage(text,filename,null);
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

function readTextToScale(text,filename){
	var scale=[];
	var lines=text.split('\n');
	if(lines[lines.length-1]=="")lines.pop();
	try{
	for(var i=0; i<lines.length;i++){
		var color=lines[i].split(" ");
		var rgb={
			r: Number(color[0]),
			g: Number(color[1]),
			b: Number(color[2])
		};
		if(isNaN(rgb.r)||isNaN(rgb.g)||isNaN(rgb.b))
			throw("error reading at line "+(i+1));
		scale.push(rgb);
	}
	if(filename[filename.length-1]=="\r") filename=filename.slice(0,-1);
	scales.push(scale);
	color_panels.push(new ColorPanel(0,0,50,50,scales.length-1));
	colormapFileNames.push(filename);
	addNewColorIconData(scales.length-1);
	}catch(e){
		alert(e);
	}
	finally{
		drawScene();
	}
}

function addNewColorIconData(cindex){
	var icondataside=64;
	var pixelData = ctx.createImageData(icondataside,1);//new Uint8Array(iconWidth*iconHeight*4);
	var interval = 1/icondataside;
	var tempColor;
	for(var i=0;i<icondataside;i++){
		tempColor = getColorHeight(cindex,i*interval);
		pixelData.data[i*4]=Math.round(tempColor.r*255);
		pixelData.data[i*4+1]=Math.round(tempColor.g*255);
		pixelData.data[i*4+2]=Math.round(tempColor.b*255);
		pixelData.data[i*4+3]=255;
	}
	/*for(var i=1;i<iconHeight;i++){
		for(var j=0;j<iconWidth*4;j++){
			pixelData[i*iconHeight*4+j]=pixelData[j];
		}
	}*/
	createImageBitmap(pixelData).then(function(response) { colorIconsData.push(response);});
	
}


