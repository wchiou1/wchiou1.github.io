var version="Generating color maps"

var canvas = document.getElementById("glcanvas");
var gl;






function start() {
	console.log("version:"+version);
	canvas2 = document.getElementById("glcanvas2");
	
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
		
		if(gl2){
				gl2.clearColor(0.0, 0.0, 0.0, 1.0);
				gl2.clearDepth(1.0);
				gl2.enable(gl.DEPTH_TEST);
				gl2.depthFunc(gl.LEQUAL);
		}
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//initTextureFramebuffer(); //#not ready

		//setInterval(drawScene, 15);
	  }
		
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
  
  //second gl canvas
   gl2 = null;

  try {
    gl2 = canvas2.getContext("experimental-webgl");
  }
  catch(e) {
  }
  if (!gl2) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
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

function drawLabSpace(cid,bufid){
	
	if(cid==null) cid=LabSpaceColor;
	if(bufid==null) bufid=0;
	
	if(lastShader2!=="simple"){
			lastShader2="simple";
			gl2.useProgram(shaderProgram.simpleShader2);
			gl2.enableVertexAttribArray(attributes.simpleShader2.vertexPositionAttribute);
			gl2.enableVertexAttribArray(attributes.simpleShader2.vertexColorAttribute);
		}
	gl2.lineWidth(3);
	
	var radx = transform2.degx * Math.PI / 180.0;
	var rady = transform2.degy * Math.PI / 180.0;
	var s=transform2.scale;

	var mvMatrix2 = Matrix.I(4).x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1]).ensure4x4());

	gl2.uniformMatrix4fv(uniforms.simpleShader2.pUniform, false, new Float32Array(pMatrix2.flatten()));
	gl2.uniformMatrix4fv(uniforms.simpleShader2.mvUniform, false, new Float32Array(mvMatrix2.flatten()));
	
	//draw axes
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-128,0,0,	128,0,0, 0,-50,0,	0,50,0, 0,0,-128, 0,0,128]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, verticesColorBuffer2);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([0,154.5/255,116.4/255,1,	1,0,124.7/255,1,	0,0,0,1, 1,1,1,1,	0,138.4/255,1,1,	148.6/255,116/255,0,1]), gl2.STATIC_DRAW);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer2);
	gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,3,4,5]), gl2.STATIC_DRAW);
	gl2.drawElements(gl2.LINES, 6, gl2.UNSIGNED_SHORT, 0);
	
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

		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[bufid]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_pos), gl2.STATIC_DRAW);
		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[bufid]);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_rgba), gl2.STATIC_DRAW);
	}

	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2[bufid]);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2[bufid]);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	
	gl2.drawArrays(gl2.POINTS, 0, len);
	
}

function drawScene() {
	gl.clearColor(.5, .5, .5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	

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
	targ.width=iconDim;
	targ.height=iconDim;
	textCanvas.width=canvas.width;
	textCanvas.height=canvas.height;
    iconX = 50*scaleSquare;
    iconY = 150*scaleY;
    imgIconX=1080*scaleX;
    imgIconY=150*scaleY;
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
    drawScene();
	drawHelpText();
   }
	
}

