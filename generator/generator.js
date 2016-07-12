var version="Testing init2"

var canvas = document.getElementById("coloriconcanvas");
var canvas2;
var colormapcanvas = document.getElementById("colormapcanvas");
var gl;
var gl2;
var colormapgl;
shaderProgram={};
attributes={};
uniforms={};
var imageCanvas;
var ctx;
var lastShader=null;
var labinput;

var color_panels=[];
var generated_panel;
var generated_ctrl=[];
var generated_scale=[];
var iconViewWidth = 70;
var iconViewHeight = 550;
var iconHeight = 50;
var iconWidth = 50;
var iconViewOffset = 0;
var scales=[];
var Shape={};
var colormapFileNames=[];
var colorIconsData=[];
var iconX = 0;
var iconY = 0;
var verticesBuffer;
var verticesColorBuffer;
var verticesIndexBuffer;
var verticesBuffer2;
var verticesColorBuffer2;
var verticesIndexBuffer2;
var pointBuffer2=[];
var pointColorBuffer2=[];
var selectedColor=-1;
var screenscale=1;
var lastMouseX;
var lastMouseY;
var clickedElement=null;
var mouseDown=false;
var editCtrlPoints=false;
var L_plane=50;


var min_width=iconViewWidth;
var min_height=iconViewHeight;
var orthogonal={
	l: 0,
	r: iconViewWidth,
	t: 0,
	b: -iconViewHeight
};
var orthoMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);

var ColorPanel= function(x,y,w,h,lab_scale,webgl){
	this.x=x;
	this.y=y;
	this.z=0;
	this.w=w;
	this.h=h;
	this.webgl=webgl;
	this.lab_scale=lab_scale;
	this.verticesBuffer=Shape.rectangle.verticesBuffer;
	this.verticesTexCoordBuffer=Shape.rectangle.verticesTexCoordBuffer;
	this.texture=webgl.createTexture();
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
			var rgb=lab_to_rgb(scale[i]);
			array.push(Math.round(rgb.R));
			array.push(Math.round(rgb.G));
			array.push(Math.round(rgb.B));
			array.push(255);
		}
		return new Uint8Array(array);
	}
	
	this.create= 
	function(scale){
		self.lab_scale=scale;
		if(scale==null||scale.length==0)
			return;
		var webgl=self.webgl;
		webgl.bindTexture(webgl.TEXTURE_2D, self.texture);
		webgl.texImage2D(webgl.TEXTURE_2D, 0, gl.RGBA, scale.length, 1, 0, webgl.RGBA, webgl.UNSIGNED_BYTE,flatten(scale));
		setTexParameter();
	};
	this.create(lab_scale);
	this.draw=function(inverted){
		if(self.lab_scale==null||self.lab_scale==0)
			return;
		var webgl=self.webgl;
		if(lastShader!=="colormapShader"){
			lastShader="colormapShader";
			webgl.useProgram(shaderProgram.colormapShader);
			webgl.enableVertexAttribArray(attributes.colormapShader.vertexPositionAttribute);
			webgl.enableVertexAttribArray(attributes.colormapShader.vertexTexCoordAttribute);
		}
			
		webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesBuffer);
		webgl.vertexAttribPointer(attributes.colormapShader.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);
		if(inverted)
			webgl.bindBuffer(webgl.ARRAY_BUFFER, Shape.rectangle.invertedTexCoordBuffer);
		else
			webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		webgl.vertexAttribPointer(attributes.colormapShader.vertexTexCoordAttribute, 2, webgl.FLOAT, false, 0, 0);
		
		webgl.uniform1i(uniforms.colormapShader.uColormapLoc, 0);  
		webgl.activeTexture(webgl.TEXTURE0);
		webgl.bindTexture(webgl.TEXTURE_2D, self.texture);
		
		perspectiveMatrix = orthoMatrix;

		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);

		setMatrixUniforms(uniforms.colormapShader);

		webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
		
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

$(document).on('load',FileListenerInit());
function start() {
	console.log("version:"+version);
	canvas2 = document.getElementById("labcanvas");
	
	addEventHandler(window,"resize",on_resize(resize));
	gl=initWebGL(canvas);
	gl2=initWebGL(canvas2);
	colormapgl=initWebGL(colormapcanvas);
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

		if(gl2){
				gl2.clearColor(0.0, 0.0, 0.0, 1.0);
				gl2.clearDepth(1.0);
				gl2.enable(gl.DEPTH_TEST);
				gl2.depthFunc(gl.LEQUAL);
		}
		if(colormapgl){
				gl2.clearColor(0.0, 0.0, 0.0, 1.0);
				gl2.clearDepth(1.0);
				gl2.enable(gl.DEPTH_TEST);
				gl2.depthFunc(gl.LEQUAL);
		}
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//initTextureFramebuffer(); //#not ready
		initShaders();
		initBuffers();
		initElements();
		initT2();
		readFilesOnLoad()
		initShape();
		resize();
		generated_panel=new ColorPanel(0,0,480,66,generated_scale,colormapgl);
		imageCanvas=document.getElementById("imageCanvas");
		ctx=imageCanvas.getContext("2d");
		drawScene();
	}
	  
	
}

 $( function() {
	 $("#list_of_ctrl_points").sortable({
		handle: ".handle",
        stop : function(event, ui){
          update_ctrl_points_from_html();
        },
		containment: "parent",
		placeholder: "sortable-placeholder"
	}).selectable({
		cancel: ".handle"
	});
	 
    $( "#slider-vertical" ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: L_plane,
      slide: function( event, ui ) {
        L_plane= ui.value;
		drawLabSpace(selectedColor,0);
		var gray=(255*ui.value/100)|0;
		sliderColor="rgb("+gray+","+gray+","+gray+")";
		$( "#slider-vertical .ui-slider-range" ).css( "background-color", sliderColor );
		$( "#slider-vertical .ui-state-default, .ui-widget-content .ui-state-default" ).css( "background-color", sliderColor );

      }
    });
  } );

function initElements(){
	canvas.width = iconViewWidth;
    canvas.height = iconViewHeight;

	var resetbutton = document.getElementById("button4");
	
	var offset60=60*screenscale;
	var offset30=30*screenscale;
	$(".button").width(iconViewWidth+offset60+"px").height(offset30+"px")
	.css("font-size",((12*screenscale)|0)+"px").css("line-height",offset30+"px");
	
	resetbutton.style.left = 200-offset30+"px";
	resetbutton.style.top = 200+iconViewHeight+110*screenscale+"px";
	
	var colordrop=document.getElementById("colordrop");
	var iconstyle = window.getComputedStyle(canvas, null);
	colordrop.style.left=iconstyle.left;
	colordrop.style.top=iconstyle.top;
	colordrop.style.width=(canvas.width+4)+"px";
	colordrop.style.height=(canvas.height+4)+"px";
}

function initBuffers(){
	verticesBuffer = gl.createBuffer();
	verticesColorBuffer = gl.createBuffer();
	verticesIndexBuffer=gl.createBuffer();
	verticesBuffer2=gl2.createBuffer();
	verticesColorBuffer2=gl2.createBuffer();
	verticesIndexBuffer2=gl2.createBuffer();
	pointBuffer2[0]=gl2.createBuffer();
	pointColorBuffer2[0]=gl2.createBuffer();
	pointBuffer2[1]=gl2.createBuffer();
	pointColorBuffer2[1]=gl2.createBuffer();
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

function initWebGL(glcanvas) {
  var gl = null;

  try {
    gl = glcanvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
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
	
	//second gl 
	var simple_vertexShader2 = getShader(gl2, "simple-shader-vs");
	var simple_fragmentShader2 = getShader(gl2, "simple-shader-fs");
	shaderProgram.simpleShader2 = gl2.createProgram();
	gl2.attachShader(shaderProgram.simpleShader2, simple_vertexShader2);
	gl2.attachShader(shaderProgram.simpleShader2, simple_fragmentShader2);
	gl2.linkProgram(shaderProgram.simpleShader2);
	if (!gl2.getProgramParameter(shaderProgram.simpleShader2, gl2.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " );
	}
	attributes.simpleShader2={
		vertexPositionAttribute : gl2.getAttribLocation(shaderProgram.simpleShader2, "aVertexPosition"),
		vertexColorAttribute : gl2.getAttribLocation(shaderProgram.simpleShader2, "aVertexColor")
	};
	uniforms.simpleShader2={
		pUniform : gl2.getUniformLocation(shaderProgram.simpleShader2, "uPMatrix"),
		mvUniform : gl2.getUniformLocation(shaderProgram.simpleShader2, "uMVMatrix")
	};
	var lab_vertexShader2 = getShader(gl2, "lab-shader-vs");
	var lab_fragmentShader2 = getShader(gl2, "lab-shader-fs");
	shaderProgram.labShader2 = gl2.createProgram();
	gl2.attachShader(shaderProgram.labShader2, lab_vertexShader2);
	gl2.attachShader(shaderProgram.labShader2, lab_fragmentShader2);
	gl2.linkProgram(shaderProgram.labShader2);
	if (!gl2.getProgramParameter(shaderProgram.labShader2, gl2.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " );
	}
	attributes.labShader2={
		vertexPositionAttribute : gl2.getAttribLocation(shaderProgram.labShader2, "aVertexPosition")
	};
	uniforms.labShader2={
		pUniform : gl2.getUniformLocation(shaderProgram.labShader2, "uPMatrix"),
		mvUniform : gl2.getUniformLocation(shaderProgram.labShader2, "uMVMatrix")
	};
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

//Returns which index of the color map the icon represents or -1 if no icon was hit
function testIconHit(event){
	var mouse=getMousePos(canvas,event);
	//First test x value
	if(mouse.x<iconX+10||mouse.x>iconX+10+iconWidth){
		return -1;
	}
	//Test y values
	for(var i=0;i<scales.length;i++){
		if(mouse.y>iconY+10+i*(iconHeight+10)-iconViewOffset&&mouse.y<iconY+10+iconHeight+i*(iconHeight+10)-iconViewOffset){
			return i;
		}
	}
	return -1;
}

function testIconViewHit(event){
	var mouse=getMousePos(canvas,event);
	if(mouse.x>iconX&&mouse.x<iconX+iconViewWidth){
		if(mouse.y>iconY&&mouse.y<iconY+iconViewHeight){
			return true;
		}
	}
	return false;
}

//Returns which index of the color map the icon represents or -1 if no icon was hit
function testIconHit(event){
	var mouse=getMousePos(canvas,event);
	//First test x value
	if(mouse.x<iconX+10||mouse.x>iconX+10+iconWidth){
		return -1;
	}
	//Test y values
	for(var i=0;i<scales.length;i++){
		if(mouse.y>iconY+10+i*(iconHeight+10)-iconViewOffset&&mouse.y<iconY+10+iconHeight+i*(iconHeight+10)-iconViewOffset){
			return i;
		}
	}
	return -1;
}

function handleMouseDown(event){
	if(mouseDown)
		return;
	mouseDown=true;
	if(clickedElement==null&&testIconViewHit(event)){
		clickedElement=canvas;
		var temp=testIconHit(event);
		if(temp!=-1){
			selectedColor=temp;
			generated_scale=scales[selectedColor].slice(0);
			generated_panel.create(generated_scale);
		}
		drawLabSpace(selectedColor,0);
		update_ctrl_points_from_javascript(scales[selectedColor]);
	}
	
}
//Called when the mouse is released
function handleMouseUp(event){
	mouseDown=false;
	clickedElement=null;
}

//Called when the mouse moves
function handleMouseMove(event){
	var mouse={'x':event.clientX,'y':event.clientY};
	
	if(clickedElement!=null&&clickedElement==document.getElementById("labcanvas")){
		rotateT2(mouse.x-lastMouseX,lastMouseY-mouse.y);
		drawLabSpace(selectedColor,0);
	}
	
	if(clickedElement!=null&&clickedElement==canvas&&iconViewHeight<scales.length*(iconHeight+10)+10){
		updateIconViewOffset(mouse.x,mouse.y);
		drawColorThumbnails();
	}
	
	lastMouseX=mouse.x;
	lastMouseY=mouse.y;
	return false;
}

function MouseWheelHandler(e) {
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if(testIconViewHit(e)){
		if(iconViewHeight<scales.length*(iconHeight+10)+10){
			if(delta>0)
				scrollIconView(-15);
			else if(delta<0)
				scrollIconView(15);
			drawColorThumbnails();
		}
		e.preventDefault();
		e.returnValue=false;
	}
	return false;
}

function updateIconViewOffset(mouseX,mouseY){
	var dy=lastMouseY-mouseY;
	scrollIconView(dy);
}

function scrollIconView(delta){
	iconViewOffset = iconViewOffset+delta;
	var spacing=iconHeight+10;
	if(iconViewOffset<0){
		iconViewOffset=0;
	}
	else if(0<scales.length*spacing-iconViewHeight+10&&iconViewOffset>scales.length*spacing-iconViewHeight+10){
		iconViewOffset=scales.length*spacing-iconViewHeight+10;
	}
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

function handleResetButton(evt){
	initT2();
	drawLabSpace(selectedColor,0);
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

function drawScene() {
	gl.clearColor(.5, .5, .5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	drawColorThumbnails();
	drawLabSpace(selectedColor,0);
}

function drawColorThumbnails(){
	
	//Erase the whole of the iconview area
	clearRectangle(iconX,iconY+iconViewHeight,iconViewWidth,iconViewHeight);
	
	//this draw colormap as thumbnails;
	for(var i=0;i<color_panels.length;i++){
		if((iconHeight+10)*i+10-iconViewOffset+iconHeight<0||(iconHeight+10)*i+10-iconViewOffset>iconViewHeight){
		console.log(((iconHeight+10)*i+10-iconViewOffset)+"|"+iconViewHeight);
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
	//var newwidth = Math.max(min_width,canvas.clientWidth);
	//var newheight = Math.max(min_height,canvas.clientHeight);
	//if (canvas.width != newwidth || canvas.height != newheight) {
	gl.viewport(0,0,canvas.width,canvas.height);
	//var scaleX=newwidth/min_width;
	//var scaleY=newheight/min_height;
	//var scaleSquare=Math.min(scaleX,scaleY);
	//screenscale=scaleSquare;
	var iconDim=50//*scaleSquare;
    iconHeight = iconDim;
    iconWidth = iconDim;
	setView(0,canvas.width,-canvas.height,0);
	orthoMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);
    drawScene();
}

function readFilesOnLoad(){
	readFilesFromServer("../data/colorscale/","scale");
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
		var lab=rgb_to_lab({'R':rgb.r*255, 'G':rgb.g*255, 'B':rgb.b*255});
		scale.push(lab);
	}
	if(filename[filename.length-1]=="\r") filename=filename.slice(0,-1);
	scales.push(scale);
	color_panels.push(new ColorPanel(0,0,50,50,scale,gl));
	colormapFileNames.push(filename);
	addNewColorIconData(scales.length-1);
	}catch(e){
		alert(e);
	}
	finally{
		drawScene();
	}
}

function setView(l,r,b,t){
	orthogonal.l=l;
	orthogonal.r=r;
	orthogonal.b=b;
	orthogonal.t=t;
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
	selectedColor=colorIconsData.length-1;
}
var lastShader2;
function drawLabSpace(){
	if(generated_scale==null||generated_scale.length==0)
		return;

	var w=canvas2.width;
	var h=canvas2.height;
	//|
	//(0,0)__
	var x1=0;
	var y1=0;

	gl2.clearColor(0.5,0.5,0.5,1.0);
	gl2.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl2.viewport(x1,y1,w,h);
	
	if(lastShader2!=="simple"){
			lastShader2="simple";
			gl2.useProgram(shaderProgram.simpleShader2);
			gl2.enableVertexAttribArray(attributes.simpleShader2.vertexPositionAttribute);
			gl2.enableVertexAttribArray(attributes.simpleShader2.vertexColorAttribute);
		}
	gl2.lineWidth(5);
	
	var radx = transform2.degx * Math.PI / 180.0;
	var rady = transform2.degy * Math.PI / 180.0;
	var s=transform2.scale;

	var mvMatrix2 = Matrix.I(4).x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1])).x(Matrix.Translation($V([0,-50,0])));

	gl2.uniformMatrix4fv(uniforms.simpleShader2.pUniform, false, new Float32Array(pMatrix2.flatten()));
	gl2.uniformMatrix4fv(uniforms.simpleShader2.mvUniform, false, new Float32Array(mvMatrix2.flatten()));
	
	//draw axes
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-128,50,0,	128,50,0, 0,0,0,	0,100,0, 0,50,-128, 0,50,128]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesColorBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([0,154.5/255,116.4/255,1,	1,0,124.7/255,1,	0,0,0,1, 0,0,0,1,	0,138.4/255,1,1,	148.6/255,116/255,0,1]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	gl2.drawArrays(gl2.LINES, 0, 6);
	
	//draw colors
	if(generated_scale==undefined)return;
	var len=generated_scale.length;
	
	var scale=generated_scale;
	var list_rgba=[];
	var list_pos=[];
	for(var i=0;i<len;i++){
		var lab=scale[i];
		list_pos.push(lab.a);
		list_pos.push(lab.L-50);
		list_pos.push(lab.b);
		
		var rgb=lab_to_rgb(lab);
		list_rgba.push(rgb.R/255);
		list_rgba.push(rgb.G/255);
		list_rgba.push(rgb.B/255);
		list_rgba.push(1);
	}

	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[0]);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_pos), gl2.STATIC_DRAW);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[0]);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_rgba), gl2.STATIC_DRAW);

	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[0]);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[0]);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	
	gl2.drawArrays(gl2.POINTS, 0, len);
	
	//draw L-plane
	if(lastShader2!=="lab"){
		lastShader2="lab";
		gl2.useProgram(shaderProgram.labShader2);
		gl2.enableVertexAttribArray(attributes.labShader2.vertexPositionAttribute);
	}
	gl2.uniformMatrix4fv(uniforms.labShader2.pUniform, false, new Float32Array(pMatrix2.flatten()));
	gl2.uniformMatrix4fv(uniforms.labShader2.mvUniform, false, new Float32Array(mvMatrix2.flatten()));
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-128,L_plane,-128,	128,L_plane,-128, -128,L_plane,128,	128,L_plane,128]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.labShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
}

function handleLabCanvasClick(evt){
	var mouse=getMousePos(canvas2,evt);
	clickedElement=document.getElementById("labcanvas");
}

function handleIconCanvasClick(evt){
	var mouse=getMousePos(canvas2,evt);
	clickedElement=document.getElementById("coloriconcanvas");
}

function handleLabCanvasWheel(evt){
	var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if(delta>0)
		scaleT2(1.1);
	else if(delta<0)
		scaleT2(0.9);
	drawLabSpace(selectedColor,0);
	e.preventDefault();
	e.returnValue=false;
	return false;
}
function FileListenerInit(){
	if(window.FileReader) {
		addEventHandler(window, 'load', function() {
			var drop2  = document.getElementById('colordrop');
			var button4 = document.getElementById('button4');
			
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
			labinput=$("#lab-inputs");
			labinput.hide();
			addEventHandler(drop2, 'dragover', cancel);
			addEventHandler(drop2, 'dragenter', cancel);
			addEventHandler(drop2,'drop', function(e){readDroppedFiles(e,'color');});
			addEventHandler(button4,'click', handleResetButton);
			addEventHandler(canvas2,'mousedown', handleLabCanvasClick);
			addEventHandler(canvas2,'wheel', handleLabCanvasWheel);
			$("#delete").on("click",function(){$('.ui-selected').remove(); update_ctrl_points_from_html();});
			$("#insert").on("click",function(){addPointToList(); update_ctrl_points_from_html();});
			$("#edit").on("click",handleEdit);
			

			
			//Icon canvas cannot use eventhandler because all events are blocked by drop
			//addEventHandler(canvas,'mousedown', handleIconCanvasClick);
		});
	} else {
	  alert('Your browser does not support the HTML5 FileReader.');
	}
}
function handleEdit(){
	editCtrlPoints=!editCtrlPoints;
	if(editCtrlPoints){
		$("#edit").text('update');
		$("#list_of_ctrl_points").selectable("disable")
		.on("click","div",function(e){$(this).attr("tabindex","1").attr("contenteditable","true").css("background-color","white").css("color","black")
		.blur(function(e){$(this).attr("contenteditable","false").attr("tabindex","-1").css("background-color","").css("color","").off("blur");}).get(0).focus();
		});
	}
	else{
		$("#edit").text('edit');
		$("#list_of_ctrl_points").selectable("enable").off("click");
	}
}
var constraint={
	steps: 1000,
	delta_e:2,
	tolerance: 0.01,
	//ctrl_points:[{L:0,a:0,b:0},{L:39,a:55,b:36},{L:57, a:42, b:64},{L:83,a:-10,b:83},{L:100,a:0,b:0}]
	ctrl_points:[]
}
constraint.addPoint=function(){
	this.ctrl_points.push({L:0,a:0,b:0});
}
constraint.removePoint=function(i){
	this.ctrl_points.splice(i,1);
}

var constraint2={
	steps: 200,
	delta_e:1.5,
	tolerance: 0.01,
	ctrl_points:[{L:39,a:39,b:-62},{L:60,a:24,b:-54},{L:76, a:10, b:-37},{L:86, a:1, b:-13},{L:86, a:6, b:11},{L:75, a:24, b:27},{L:58, a:44, b:34},{L:37, a:62, b:32}]
}

function generateColormap(constraint){
	var colors=[];
	var last_ctrl_point=0;
	var lastLab=constraint.ctrl_points[0];
	colors.push(lastLab); //first Lab color
	var i=1;
	var bound={min:0, max:1, mid:function(){return (this.min+this.max)/2}};
	
	var dirr=dir(constraint.ctrl_points[last_ctrl_point+1],lastLab);
	while(i<constraint.steps){
		
		var test=bound.mid()
		var newLab=Lab_add(lastLab,timesLen(dirr,test));
		var d_e=ciede2000(lastLab,newLab);
		//console.log(lastLab);
		//console.log(newLab);
		if(d_e>constraint.delta_e+constraint.tolerance){
			bound.max=test;//console.log(d_e+" max="+test);
		}
		else if(d_e<constraint.delta_e-constraint.tolerance){
			bound.min=test;//console.log(d_e+" min="+test);
		}
		else{
			colors.push(newLab);//console.log(newLab);
			lastLab=newLab;
			if(ciede2000(lastLab, constraint.ctrl_points[last_ctrl_point+1])<constraint.delta_e){
				last_ctrl_point++;
				if(last_ctrl_point>=constraint.ctrl_points.length-1){
					alert("cannot generate enough points, path is too short or deltaE is too large");
					break;
				}
				
			}
			dirr=dir(constraint.ctrl_points[last_ctrl_point+1],lastLab);
			bound.min=0;
			bound.max=1;
			i++;
		}
	}
	//return colors;
	var outputText="";
	for(var ii=0;ii<colors.length;ii++){
		var rgb=lab_to_rgb(colors[ii]);
		var r=rgb.R/255;
		var g=rgb.G/255;
		var b=rgb.B/255;
		if(r>1||r<0||g>1||g<0||b>1||b<0)
			console.log("non-displayable color on line "+ii);
		outputText+=r+" "+g+" "+b+"\n";
	}
	download(outputText, "generated_colormap", 'text/plain');
}
var how_many_points_has_been_added=0;
function addPointToList(lab){
	if(!lab){
		var l=0;
		var a=0;
		var b=0;
	}else{
		var l=lab.L;
		var a=lab.a;
		var b=lab.b;
	}
	var postpend="<div class='handle'><span class='ui-icon ui-icon-carat-2-n-s'></span></div>";
	var labspan="<div>"+l+"</div><div>"+a+"</div><div>"+b+"</div>"
	$("#list_of_ctrl_points").append("<li id='ctrl"+how_many_points_has_been_added+"' class='ui-state-default'>"+labspan+postpend+"</li>");
	how_many_points_has_been_added++;
}

function makePointEditable(point){
	point.children("div")
	.click(function(e){$(this).attr("contenteditable","true").css("background-color","white").css("color","black").focus()
	.blur(function(e){$(this).attr("contenteditable","false").css("background-color","").css("color","white");
	});
	})
	.on("blur",function(){makePointUneditable(point)});;
	$("#list_of_ctrl_points").selectable("disable");
	
}
function makePointUneditable(point){
	point.children("div").attr("contenteditable","false");
	console.log("called");
	point.off("blur");
	$("#list_of_ctrl_points").selectable("enable");
}
function update_ctrl_points_from_html(){
	var idarray=$("#list_of_ctrl_points").sortable('toArray');
	var a_points=[];
	for(var i=0;i<idarray.length;i++){
		var li=document.getElementById(idarray[i]);
		var Lab=li.children;
		var L=Number(Lab[0].textContent);
		var a=Number(Lab[1].textContent);
		var b=Number(Lab[2].textContent);
		a_points.push({'L':L,'a':a,'b':b});
	}
	constraint.ctrl_points=a_points;
	
}
function update_ctrl_points_from_javascript(lab_arr){
	$("#list_of_ctrl_points").empty();
	how_many_points_has_been_added=0;
	for(var i=0;i<lab_arr.length;i++){
		var lab=lab_arr[i];
		lab.L=lab.L.toFixed(3);
		lab.a=lab.a.toFixed(3);
		lab.b=lab.b.toFixed(3);
		addPointToList(lab);
	}
	update_ctrl_points_from_html();
}
function Lab_add(Lab,arr){
	return {L:Lab.L+arr[0] , a:Lab.a+arr[1] , b:Lab.b+arr[2] };
}
function dir(Lab1,Lab2){
	return [Lab1.L-Lab2.L,Lab1.a-Lab2.a,Lab1.b-Lab2.b];
}
function timesLen(dir,len){
	return dir.map(function(x){return x*len});
}
