//Error! Getting a div element in the $('.ui-selected') array call. How is that happening?


var version="Handle edit"

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

var editIndex=-1;
var color_panels=[];
var generated_panel;
var generated_ctrl=[];
var generated_scale=[];
var holding_scale=[];
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
var highlightPoint=-1;
var min_width=iconViewWidth;
var min_height=iconViewHeight;
var pMatrix2;
var selectedPoints=[];
var displayMode=0; // 0=generated points 1=ctrl points
var selectedPoints2=[];
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
	if(webgl==colormapgl){
		this.verticesBuffer=Shape.rectangle2.verticesBuffer;
		this.verticesTexCoordBuffer=Shape.rectangle2.verticesTexCoordBuffer;
	}
	else{
		this.verticesBuffer=Shape.rectangle.verticesBuffer;
		this.verticesTexCoordBuffer=Shape.rectangle.verticesTexCoordBuffer;
	}
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
		setTexParameter(webgl);
	};
	this.create(lab_scale);
	this.draw=function(inverted){
		if(self.lab_scale==null||self.lab_scale==0)
			return;
		var webgl=self.webgl;
		
		if(webgl==colormapgl){
			if(lastShader!=="colormapShader3"){
				lastShader="colormapShader3";
				webgl.useProgram(shaderProgram.colormapShader3);
				webgl.enableVertexAttribArray(attributes.colormapShader3.vertexPositionAttribute);
				webgl.enableVertexAttribArray(attributes.colormapShader3.vertexTexCoordAttribute);
			}
			
			webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesBuffer);
			webgl.vertexAttribPointer(attributes.colormapShader3.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);
			if(inverted)
				webgl.bindBuffer(webgl.ARRAY_BUFFER, Shape.rectangle2.invertedTexCoordBuffer);
			else
				webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
			webgl.vertexAttribPointer(attributes.colormapShader3.vertexTexCoordAttribute, 2, webgl.FLOAT, false, 0, 0);
			
			webgl.uniform1i(uniforms.colormapShader3.uColormapLoc, 0);  
			webgl.activeTexture(webgl.TEXTURE0);
			webgl.bindTexture(webgl.TEXTURE_2D, self.texture);
			
			perspectiveMatrix = orthoMatrix;

			loadIdentity();
			mvPushMatrix();
			mvTranslate([self.x, self.y, self.z-1.0]);
			mvScale([self.w,self.h,1]);

			setMatrixUniforms(uniforms.colormapShader3,webgl);

			webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
			
			mvPopMatrix();
			return;
		}
		
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

		setMatrixUniforms(uniforms.colormapShader,webgl);

		webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
};

var Rectangle= function(webgl){
	this.x = 0;
	this.y = 0;
	this.w = 0;
	this.h = 0;
	this.verticesBuffer = webgl.createBuffer();
	this.verticesColorBuffer = webgl.createBuffer();
	this.verticesTexCoordBuffer=webgl.createBuffer();
	this.invertedTexCoordBuffer=webgl.createBuffer();
	this.webgl=webgl;
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
	
	webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesBuffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([0,0,0,	0,-1,0,	1,0,0, 1,-1,0]), webgl.STATIC_DRAW);
	
	webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesColorBuffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([1,1,1,1,	1,1,1,1, 1,1,1,1,	1,1,1,1]), webgl.STATIC_DRAW);
	
	webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([0,1, 0,0, 1,1, 1,0]), webgl.STATIC_DRAW);
	
	webgl.bindBuffer(webgl.ARRAY_BUFFER, self.invertedTexCoordBuffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([1,1, 1,0, 0,1, 0,0]), webgl.STATIC_DRAW);
	
	this.changeColor= function(r,g,b,a){
		if(a==undefined) a=1;
		var webgl=self.webgl;
		webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesColorBuffer);
		webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([r,g,b,a,	r,g,b,a, r,g,b,a,	r,g,b,a]), webgl.STATIC_DRAW);
	};
	this.draw= function(){
	
		var webgl=self.webgl;
		if(webgl==colormapgl){
			if(lastShader!=="simple3"){
				lastShader="simple3";
				webgl.useProgram(shaderProgram.simpleShader3);
				webgl.enableVertexAttribArray(attributes.simpleShader3.vertexPositionAttribute);
				webgl.enableVertexAttribArray(attributes.simpleShader3.vertexColorAttribute);
			}

			webgl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
			webgl.vertexAttribPointer(attributes.simpleShader3.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);
			webgl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
			webgl.vertexAttribPointer(attributes.simpleShader3.vertexColorAttribute, 4, webgl.FLOAT, false, 0, 0);
			
			perspectiveMatrix = orthoMatrix;
			
			loadIdentity();
			mvPushMatrix();
			mvTranslate([self.x, self.y, self.z-1.0]);
			mvScale([self.w,self.h,1]);
			
			setMatrixUniforms(uniforms.simpleShader3,webgl);
			
			webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
			
			mvPopMatrix();
			return;
		}
		if(lastShader!=="simple"){
			lastShader="simple";
			webgl.useProgram(shaderProgram.simpleShader);
			webgl.enableVertexAttribArray(attributes.simpleShader.vertexPositionAttribute);
			webgl.enableVertexAttribArray(attributes.simpleShader.vertexColorAttribute);
		}


		webgl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		webgl.vertexAttribPointer(attributes.simpleShader.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);
		webgl.bindBuffer(gl.ARRAY_BUFFER, self.verticesColorBuffer);
		webgl.vertexAttribPointer(attributes.simpleShader.vertexColorAttribute, 4, webgl.FLOAT, false, 0, 0);
		
		perspectiveMatrix = orthoMatrix;
		
		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);
		
		setMatrixUniforms(null,webgl);
		
		webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
	this.drawWithTexture=function(texture){
		var webgl=self.webgl;
		if(webgl==colormapcanvas){
			if(lastShader!=="colormapShader3"){
				lastShader="colormapShader3";
				webgl.useProgram(shaderProgram.colormapShader3);
				webgl.enableVertexAttribArray(attributes.colormapShader3.vertexPositionAttribute);
				webgl.enableVertexAttribArray(attributes.colormapShader3.vertexTexCoordAttribute);
			}
				
			webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesBuffer);
			webgl.vertexAttribPointer(attributes.colormapShader3.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);

			webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
			webgl.vertexAttribPointer(attributes.colormapShader3.vertexTexCoordAttribute, 2, webgl.FLOAT, false, 0, 0);
			
			webgl.uniform1i(uniforms.colormapShader3.uColormapLoc, 0);  
			webgl.activeTexture(webgl.TEXTURE0);
			webgl.bindTexture(webgl.TEXTURE_2D, texture);
			
			perspectiveMatrix = orthoMatrix;

			loadIdentity();
			mvPushMatrix();
			mvTranslate([self.x, self.y, self.z-1.0]);
			mvScale([self.w,self.h,1]);

			setMatrixUniforms(uniforms.colormapShader,webgl);

			webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
			
			mvPopMatrix();
			return;
		}
		if(lastShader!=="colormapShader"){
			lastShader="colormapShader";
			webgl.useProgram(shaderProgram.colormapShader);
			webgl.enableVertexAttribArray(attributes.colormapShader.vertexPositionAttribute);
			webgl.enableVertexAttribArray(attributes.colormapShader.vertexTexCoordAttribute);
		}
			
		webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesBuffer);
		webgl.vertexAttribPointer(attributes.colormapShader.vertexPositionAttribute, 3, webgl.FLOAT, false, 0, 0);

		webgl.bindBuffer(webgl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		webgl.vertexAttribPointer(attributes.colormapShader.vertexTexCoordAttribute, 2, webgl.FLOAT, false, 0, 0);
		
		webgl.uniform1i(uniforms.colormapShader.uColormapLoc, 0);  
		webgl.activeTexture(webgl.TEXTURE0);
		webgl.bindTexture(webgl.TEXTURE_2D, texture);
		
		perspectiveMatrix = orthoMatrix;

		loadIdentity();
		mvPushMatrix();
		mvTranslate([self.x, self.y, self.z-1.0]);
		mvScale([self.w,self.h,1]);

		setMatrixUniforms(uniforms.colormapShader,webgl);

		webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	};
};

$(document).on('load',FileListenerInit());
function start() {
	console.log("version:"+version);
	canvas2 = document.getElementById("labcanvas");
	pMatrix2=makeOrtho(-canvas2.width/2,canvas2.width/2,-canvas2.height/2,canvas2.height/2,-99999,99999);
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
	 $("#list_of_ctrl_points1").sortable({
		handle: ".handle",
        stop : function(event, ui){
          update_ctrl_points_from_html(0);
        },
		containment: "parent",
		placeholder: "sortable-placeholder"
	}).selectable({
		cancel: ".handle",
		stop: function(event, ui){
			selectedPoints=[];
			$(this).children(".ui-selected").each(function(){selectedPoints.push($(this).index())});
			drawLabSpace();
		}
	});
	
	 $("#list_of_ctrl_points2").sortable({
		handle: ".handle",
        stop : function(event, ui){
          update_ctrl_points_from_html(1);
        },
		containment: "parent",
		placeholder: "sortable-placeholder"
	}).selectable({
		cancel: ".handle",
		stop: function(event, ui){
			selectedPoints2=[];
			$(this).children(".ui-selected").each(function(){selectedPoints2.push($(this).index())});
			drawLabSpace();
		}
	});
	 
    $( "#slider-vertical" ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: L_plane,
      slide: function( event, ui ) {
        L_plane= ui.value;
		drawLabSpace();
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
	
	resetbutton.style.left = 30+"px";
	resetbutton.style.top = 585+"px";
	resetbutton.style.width = 74+"px";
	resetbutton.style.height = 27+"px";
	
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

function setTexParameter(webgl){
	webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
	webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
	webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
}

function initShape(){
	Shape.rectangle= new Rectangle(gl);
	Shape.rectangle2= new Rectangle(colormapgl);
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
	
	//colormapgl
	var colormap_vertexShader3 = getShader(colormapgl, "colormap-shader-vs");
	var colormap_fragmentShader3 = getShader(colormapgl, "colormap-shader-fs");
	shaderProgram.colormapShader3 = colormapgl.createProgram();
	colormapgl.attachShader(shaderProgram.colormapShader3, colormap_vertexShader3);
	colormapgl.attachShader(shaderProgram.colormapShader3, colormap_fragmentShader3);
	colormapgl.linkProgram(shaderProgram.colormapShader3);
	if (!colormapgl.getProgramParameter(shaderProgram.colormapShader3, colormapgl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: ");
	}
	attributes.colormapShader3={
		vertexPositionAttribute : colormapgl.getAttribLocation(shaderProgram.colormapShader3, "aVertexPosition"),
		vertexTexCoordAttribute : colormapgl.getAttribLocation(shaderProgram.colormapShader3, "aVertexTexCoord")
	};
	uniforms.colormapShader3={
		pUniform : colormapgl.getUniformLocation(shaderProgram.colormapShader3, "uPMatrix"),
		mvUniform : colormapgl.getUniformLocation(shaderProgram.colormapShader3, "uMVMatrix"),
		uColormapLoc : colormapgl.getUniformLocation(shaderProgram.colormapShader3, "uColormap")
	};
	var simple_vertexShader3 = getShader(colormapgl, "simple-shader-vs");
	var simple_fragmentShader3 = getShader(colormapgl, "simple-shader-fs");
	shaderProgram.simpleShader3 = colormapgl.createProgram();
	colormapgl.attachShader(shaderProgram.simpleShader3, simple_vertexShader3);
	colormapgl.attachShader(shaderProgram.simpleShader3, simple_fragmentShader3);
	colormapgl.linkProgram(shaderProgram.simpleShader3);
	if (!colormapgl.getProgramParameter(shaderProgram.simpleShader3, colormapgl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " );
	}
	attributes.simpleShader3={
		vertexPositionAttribute : colormapgl.getAttribLocation(shaderProgram.simpleShader3, "aVertexPosition"),
		vertexColorAttribute : colormapgl.getAttribLocation(shaderProgram.simpleShader3, "aVertexColor")
	};
	uniforms.simpleShader3={
		pUniform : colormapgl.getUniformLocation(shaderProgram.simpleShader3, "uPMatrix"),
		mvUniform : colormapgl.getUniformLocation(shaderProgram.simpleShader3, "uMVMatrix")
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

function testLPlaneIntersect(event){
	var mouse=getMousePos(canvas2,event);
	var x=mouse.x - canvas2.width/2;
	var y=canvas2.width/2 - mouse.y;

	var radx = transform2.degx * Math.PI / 180.0;
	var rady = transform2.degy * Math.PI / 180.0;
	var s=transform2.scale;

	var inv_rot2=(Matrix.RotationY(-rady))
		.x(Matrix.RotationX(-radx)).ensure4x4();
	var inv_mvMatrix2 = 
		(Matrix.Translation($V([0,50,0])))
		.x(Matrix.Diagonal([1/s,1/s,1/s,1]))
		.x(inv_rot2);
		
	var dir=inv_rot2.x($V([0,0,-1,0]));
	var origin=inv_mvMatrix2.x($V([x,y,0,0]));
	var t=(L_plane-origin.e(2)-50)/dir.e(2);
	return origin.add(dir.x(t));
}

function testCtrlPointHit(event){
	var mouse=getMousePos(canvas2,event);
	var x=mouse.x - canvas2.width/2;
	var y=canvas2.width/2 - mouse.y;
	var mvMat=transform2.mvMatrix;
	var points=constraint.ctrl_points.map(function(lab){return mvMat.x($V([lab.a,lab.L,-lab.b,1]))});
	var size=5;
	var hit;
	for(var i=0;i<points.length;i++){
		var px=points[i].e(1);
		var py=points[i].e(2);
		if(x<px+size&&x>px-size&&y<py+size&&y>py-size&&(hit==undefined||points[hit].e(3)<points[i].e(3))){
			hit=i;
		}
	}
	return hit;
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
			//holding_scale=scales[selectedColor].slice(0);
			//generated_panel.create(generated_scale);
		}
		selectedPoints.length=0;
		update_ctrl_points_from_javascript(scales[selectedColor]);
		drawLabSpace();
	}
	console.log(testCtrlPointHit(event));
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
		drawLabSpace();
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

var transform2={
	degx: 0,
	degy: 0,
	scale: 1,
	mvMatrix: Matrix.I(4),
	updateMatrix: function(){
		var radx = transform2.degx * Math.PI / 180.0;
		var rady = transform2.degy * Math.PI / 180.0;
		var s=transform2.scale;
		var translate=$V([0,-50,0]);
		this.mvMatrix = Matrix.I(4).x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1])).x(Matrix.Translation(translate));
	}
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

function setMatrixUniforms(shader,webgl) {
	if(!shader)
		shader = uniforms.simpleShader;
	webgl.uniformMatrix4fv(shader.pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
	webgl.uniformMatrix4fv(shader.mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function handleResetButton(evt){
	initT2();
	update_ctrl_points_from_html();
	drawLabSpace();
}

function initT2(){
	transform2.degx=45;
	transform2.degy=45;
	transform2.scale=1;
	transform2.updateMatrix();
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
	transform2.updateMatrix();
}
function scaleT2(scalar){
	transform2.scale*=scalar;
	transform2.updateMatrix();
}

function drawScene() {
	gl.clearColor(.5, .5, .5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	drawColorThumbnails();
	drawLabSpace();
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
//Draws the colormap in the the colormapcanvas
function updateMainColormap(){
	if(constraint.ctrl_points.length<=0)
		return;
	//console.log("Drawing main color map");
	constraint.steps=Number(document.getElementById("steps_input").value);
	constraint.delta_e=Number(document.getElementById("de_input").value);
	generated_scale=generateColormap(constraint);
	//var debug="";
	//for(var i=0;i<generated_scale.length;i++)
		//debug+=""+generated_scale+",";
	//console.log(debug);
	colormapgl.clearColor(.5, 0, 0, 1);
	colormapgl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	generated_panel.create(generated_scale);
	generated_panel.scale(70,550);
	generated_panel.draw();
	//var rectangle=Shape.rectangle2;
	//rectangle.scale(2000,2000);
	//rectangle.move(-500,-500,-.5);
	//rectangle.changeColor(.0,.0,.5);
	//rectangle.draw();
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
	
	/**var radx = transform2.degx * Math.PI / 180.0;
	var rady = transform2.degy * Math.PI / 180.0;
	var s=transform2.scale;
	
	var mvMatrix2 = Matrix.I(4).x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1])).x(Matrix.Translation($V([0,-50,0])));
	**/
	var mvMatrix2=transform2.mvMatrix;
	gl2.uniformMatrix4fv(uniforms.simpleShader2.pUniform, false, new Float32Array(pMatrix2.flatten()));
	gl2.uniformMatrix4fv(uniforms.simpleShader2.mvUniform, false, new Float32Array(mvMatrix2.flatten()));
	
	//draw axes
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-128,50,0,	128,50,0, 0,0,0,	0,100,0, 0,50,-128, 0,50,128]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesColorBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([0,154.5/255,116.4/255,1,	1,0,124.7/255,1,	0,0,0,1, 0,0,0,1,	148.6/255,116/255,0,1,	0,138.4/255,1,1]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	gl2.drawArrays(gl2.LINES, 0, 6);

	if(displayMode==0){
		//draw colors
		if(generated_scale==undefined)return;
		var len=generated_scale.length;
		var scale=generated_scale;
		var list_rgba=[];
		var list_pos=[];
		for(var i=0;i<len;i++){
			var lab=scale[i];
			list_pos.push(lab.a);
			list_pos.push(lab.L);
			list_pos.push(-lab.b);
			
			var rgb=lab_to_rgb(lab);
			list_rgba.push(rgb.R/255);
			list_rgba.push(rgb.G/255);
			list_rgba.push(rgb.B/255);
			list_rgba.push(1);
		}

		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[0]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_pos), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[0]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_rgba), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
		
		gl2.drawArrays(gl2.POINTS, 0, len);
	}
	else if(displayMode==1){
		var len=constraint.ctrl_points.length;
		
		var scale=constraint.ctrl_points;
		var list_rgba=[];
		var list_pos=[];
		for(var i=0;i<len;i++){
			var lab=scale[i];
			list_pos.push(lab.a);
			list_pos.push(lab.L);
			list_pos.push(-lab.b);
			
			var rgb=lab_to_rgb(lab);
			list_rgba.push(rgb.R/255);
			list_rgba.push(rgb.G/255);
			list_rgba.push(rgb.B/255);
			list_rgba.push(1);
		}

		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[0]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_pos), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[0]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_rgba), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
		
		gl2.drawArrays(gl2.POINTS, 0, len);
	}
	drawBox(mvMatrix2,pMatrix2);

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

function drawBox(mvMat,pMat){
	if(lastShader2!=="simple"){
		lastShader2="simple";
		gl2.useProgram(shaderProgram.simpleShader2);
		gl2.enableVertexAttribArray(attributes.simpleShader2.vertexPositionAttribute);
		gl2.enableVertexAttribArray(attributes.simpleShader2.vertexColorAttribute);
	}
	var matI = new Float32Array(Matrix.I(4).flatten());
	gl2.uniformMatrix4fv(uniforms.simpleShader2.pUniform, false, matI);
	gl2.uniformMatrix4fv(uniforms.simpleShader2.mvUniform, false, matI);
	const size=10/canvas2.width;
	var temp;
	if(activeList==0)
		temp=selectedPoints;
	else
		temp=selectedPoints2;
	for(var i=0;i<temp.length;i++){
		var position3f=[];
		var lab=constraint.ctrl_points[temp[i]];
		position3f.push(lab.a);
		position3f.push(lab.L);
		position3f.push(-lab.b);
		var pos2d=pMat.x(mvMat).x($V(position3f.concat(1))).elements;
		var vertices=[pos2d[0]-size,pos2d[1]-size,pos2d[2],pos2d[0]+size,pos2d[1]-size,pos2d[2],pos2d[0]+size,pos2d[1]+size,pos2d[2],pos2d[0]-size,pos2d[1]+size,pos2d[2]];
		gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesBuffer2);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
		gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesColorBuffer2);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([0,0,0,1,	0,0,0,1, 0,0,0,1,	0,0,0,1]), gl2.STATIC_DRAW);
		gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
		gl2.drawArrays(gl2.LINE_LOOP, 0, 4);
	}
}

function handleLabCanvasClick(evt){
	//var mouse=getMousePos(canvas2,evt);
	var intersection=testLPlaneIntersect(evt);
	var lab={L:intersection.e(2)+50,a:intersection.e(1),b:-intersection.e(3)};
	if(isFinite(intersection.e(1))&&isFinite(intersection.e(2))&&isFinite(intersection.e(3))){
		var rgb=lab_to_rgb(lab);
	}
	else{
		var rgb={R:-1,G:-1,B:-1};
	}
		

	//console.log(intersection.elements);
	


	//console.log(rgb);

	if(rgb.R<0||rgb.R>255||rgb.G<0||rgb.G>255||rgb.B<0||rgb.B>255){
		clickedElement=document.getElementById("labcanvas");
	}
	else{
		//clicked in colored zone
		clickedElement=null;
	}
	editIndex=$("#list_of_ctrl_points2").children('.ui-selected').first().index();
	//console.log("Index of selected:"+editIndex);
	//Check if it should overwrite the selected item in the ordered listStyleType
	if(editIndex!=-1&&!editCtrlPoints&&clickedElement==null){
		var li=$("#list_of_ctrl_points2").children("li").eq(editIndex);
		var idarray=$("#list_of_ctrl_points2").sortable('toArray');
		var li=document.getElementById(idarray[editIndex]);
		var Lab=li.children;
		//console.log("Editing:("+Lab[0].textContent+","+Lab[1].textContent+","+Lab[2].textContent+")");
		Lab[0].textContent=lab.L;
		Lab[1].textContent=lab.a;
		Lab[2].textContent=lab.b;
		update_ctrl_points_from_html();
		drawLabSpace();
	}
	
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
	drawLabSpace();
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
			$("#delete").on("click",function(){$('.ui-selected').remove(); selectedPoints.length=0; update_ctrl_points_from_html();});
			$("#insert").on("click",function(){addPointToList2(); update_ctrl_points_from_html();drawLabSpace();});
			$("#edit").on("click",handleEdit);
			$("#save").on("click",handleSave);
			$("#move").on("click",handleMove);
			$("#download").on("click",function(){download_colormap(selectedColor)});
			$("#LabList1").on("mousedown",list1click);
			$("#LabList2").on("mousedown",list2click);
			$("#de_input, #steps_input").on("keyup",function(){updateMainColormap(); drawLabSpace();});
			
			//Icon canvas cannot use eventhandler because all events are blocked by drop
			//addEventHandler(canvas,'mousedown', handleIconCanvasClick);
		});
	} else {
	  alert('Your browser does not support the HTML5 FileReader.');
	}
}

function list1click(){
	displayMode=1; 
	update_ctrl_points_from_html(0);
	updateMainColormap();
	drawLabSpace();
}

function list2click(){
	displayMode=0; 
	update_ctrl_points_from_html(1);
	updateMainColormap();
	drawLabSpace();
}

function handleMove(){
	//Get the selected items
	//$('.ui-selected')
	var selected=$("#list_of_ctrl_points1").children('.ui-selected');
	//editIndex=selected.first().index();
	//while(editIndex!=-1){
	//	console.log(editIndex);
	//	editIndex=selected.next().index()
		//var idarray=$("#list_of_ctrl_points1").sortable('toArray');
		//var li=document.getElementById(idarray[editIndex]);
	//}
	//Check if it should overwrite the selected item in the ordered listStyleType
	//	var li=$("#list_of_ctrl_points1").children("li").eq(editIndex);
	//	var idarray=$("#list_of_ctrl_points1").sortable('toArray');
	//	var li=document.getElementById(idarray[editIndex]);
	//	var Lab=li.children;
	//	Lab[0].textContent=lab.L;
	//	Lab[1].textContent=lab.a;
	//	Lab[2].textContent=lab.b;
	//var debug="";
	$.each(selected,function(i,v){
		//console.log(i+" "+v);
		var Lab=v.children;
		//console.log("Moving to list2\n("+Lab[0].textContent+","+Lab[1].textContent+","+Lab[2].textContent+")");
		var lab={
			L:Number(Lab[0].textContent),
			a:Number(Lab[1].textContent),
			b:Number(Lab[2].textContent)
		};
		addPointToList2(lab);
    });
	//console.log("Debug:"+debug);
	update_ctrl_points_from_html();
	drawLabSpace();
}
var pointCount2=0;
function addPointToList2(lab){
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
	$("#list_of_ctrl_points2").append("<li id='2ctrl"+pointCount2+"' class='ui-state-default'>"+labspan+postpend+"</li>");
	pointCount2++;
}

function handleSave(){
	//Save the generated scale and add an icon
	var filename = prompt("Please enter a filename", "generated scale");
	if(filename==null){
		alert("Invalid filename, unable to save");
		return;
	}
	scales.push(generated_scale);
	color_panels.push(new ColorPanel(0,0,50,50,generated_scale,gl));
	colormapFileNames.push(filename);
	addNewColorIconData(scales.length-1);
}

function handleEdit(){
	editCtrlPoints=!editCtrlPoints;
	//console.log("Index:"+editIndex+","+editCtrlPoints);
	if(editCtrlPoints){
		$("#edit").text('update');
		$("#list_of_ctrl_points2").selectable("disable")
		.on("click","div",function(e){$(this).attr("tabindex","1").attr("contenteditable","true").css("background-color","white").css("color","black")
		.blur(function(e){$(this).attr("contenteditable","false").attr("tabindex","-1").css("background-color","").css("color","").off("blur");}).get(0).focus();
		});
	}
	else{
		$("#edit").text('edit');
		$("#list_of_ctrl_points2").selectable("enable").off("click");
		update_ctrl_points_from_html();
		drawLabSpace();
	}
}
var constraint={
	steps: 1000,
	delta_e:1,
	tolerance: 0.01,
	ctrl_points:[]
}
constraint.addPoint=function(){
	this.ctrl_points.push({L:0,a:0,b:0});
}
constraint.removePoint=function(i){
	this.ctrl_points.splice(i,1);
}
function generateColormap(constraint){
	var colors=[];
	var last_ctrl_point=0;
	var lastLab=constraint.ctrl_points[0];
	//console.log(constraint.ctrl_points.length);
	var orii=lastLab;
	colors.push(lastLab); //first Lab color
	var i=1;
	var bound={min:0, max:1, mid:function(){return (this.min+this.max)/2}};
	if(constraint.ctrl_points.length<=1)
		return colors;
	
	while(i<constraint.steps){
		//Start of Wesley's fix 
		//if(last_ctrl_point+1<constraint.ctrl_points.length)
		while(last_ctrl_point+1<constraint.ctrl_points.length&&ciede2000(lastLab,constraint.ctrl_points[last_ctrl_point+1])<=constraint.delta_e){
			//colors.push(constraint.ctrl_points[last_ctrl_point+1]);
			last_ctrl_point++;
			orii=constraint.ctrl_points[last_ctrl_point];
			//i++;
			if(last_ctrl_point>=constraint.ctrl_points.length-1){
				//alert("cannot generate enough points, path is too short or deltaE is too large");
				//console.log("cannot generate enough points, path is too short or deltaE is too large");
				return colors;
			}
		}
		var dirr=dir(constraint.ctrl_points[last_ctrl_point+1],constraint.ctrl_points[last_ctrl_point]);
		
		var test=bound.mid()
		var newLab=Lab_add(orii,timesLen(dirr,test));
		var d_e=ciede2000(lastLab,newLab);

		
		if(d_e>constraint.delta_e+constraint.tolerance){
			bound.max=test;
		}
		else if(d_e<constraint.delta_e-constraint.tolerance){
			bound.min=test;
		}
		else{
			colors.push(newLab);
			lastLab=newLab;
			orii=lastLab;
			//if(ciede2000(lastLab, constraint.ctrl_points[last_ctrl_point+1])<constraint.delta_e){
			//	last_ctrl_point++;
				//colors.pop();
				//colors.push(constraint.ctrl_points[last_ctrl_point]);
				//lastLab=constraint.ctrl_points[last_ctrl_point];
			//}
			dirr=dir(constraint.ctrl_points[last_ctrl_point+1],lastLab);
			bound.min=0;
			bound.max=1;
			i++;
		}
	}
	return colors;
	
}
function download_colormap(cid){
	var outputText="";
	var cmap=scales[cid];
	for(var ii=0;ii<cmap.length;ii++){
		var rgb=lab_to_rgb(cmap[ii]);
		var r=rgb.R/255;
		var g=rgb.G/255;
		var b=rgb.B/255;
		outputText+=r+" "+g+" "+b+"\n";
	}
	download(outputText, colormapFileNames[cid], 'text/plain');
}
function download(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
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
	$("#list_of_ctrl_points1").append("<li id='ctrl"+how_many_points_has_been_added+"' class='ui-state-default'>"+labspan+postpend+"</li>");
	how_many_points_has_been_added++;
}

function makePointEditable(point){
	point.children("div")
	.click(function(e){$(this).attr("contenteditable","true").css("background-color","white").css("color","black").focus()
	.blur(function(e){$(this).attr("contenteditable","false").css("background-color","").css("color","white");
	});
	})
	.on("blur",function(){makePointUneditable(point)});;
	$("#list_of_ctrl_points1").selectable("disable");
	
}
function makePointUneditable(point){
	point.children("div").attr("contenteditable","false");
	console.log("called");
	point.off("blur");
	$("#list_of_ctrl_points1").selectable("enable");
}
var activeList=1;
function update_ctrl_points_from_html(listIndex){
	var idarray;
	if(!listIndex)
		listIndex=0;
	activeList=listIndex;
	if(activeList==1)
		idarray=$("#list_of_ctrl_points2").sortable('toArray');
	else
		idarray=$("#list_of_ctrl_points1").sortable('toArray');
	var a_points=[];
	for(var i=0;i<idarray.length;i++){
		//console.log("html id:"+idarray[i]);
		var li=document.getElementById(idarray[i]);
		var Lab=li.children;
		var L=Number(Lab[0].textContent);
		var a=Number(Lab[1].textContent);
		var b=Number(Lab[2].textContent);
		a_points.push({'L':L,'a':a,'b':b});
		//console.log("Update from html\nL:"+L+",a:"+a+",b:"+b);
	}
	constraint.ctrl_points=a_points;
	updateMainColormap();
	
}
function update_ctrl_points_from_javascript(lab_arr){
	$("#list_of_ctrl_points1").empty();
	how_many_points_has_been_added=0;
	for(var i=0;i<lab_arr.length;i++){
		var lab=lab_arr[i];

		lab.L=Math.floor(lab.L*1000)/1000;
		lab.a=Math.floor(lab.a*1000)/1000;
		lab.b=Math.floor(lab.b*1000)/1000;
		//console.log("Added color to list1\nL:"+lab.L+",a:"+lab.a+",b:"+lab.b);
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
