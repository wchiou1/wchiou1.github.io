
var version="cleanup5 + readfile on load 2"
var canvas;
var gl;
var imageCanvas;
var ctx;
var canvas2;
var gl2;

var mvMatrix;
var shaderProgram={};
var attributes={};
var uniforms={};
var perspectiveMatrix;
var lastShader=null;

var mouseDown=false;
var lastMouseX;
var lastMouseY;

var verticesBuffer;
var verticesColorBuffer;
var verticesBuffer2;
var verticesColorBuffer2;
var verticesIndexBuffer2;
var defaultColor;

//Color stuffs
var colorMaps = [];//2d array of objects which stores the colors
var iconHeight = 50;
var iconWidth = 50;
var iconX = 50;
var iconY = 150;
var imgIconX=1100;
var imgIconY=150;
var receiveX = 200;
var receiveY = 150;
var receiveDelta = 325;
var dragIcon=-1;
var imgIndex = 0;
var mapCIndices = [0,1];
var setColorHeight = [0,0];
var iconViewOffset = 0;
var iconViewWidth = 70;
var iconViewHeight = 400;
var resetIconX = 630;
var resetIconY = 10;
var scaleWidth = 400;
var scaleHeight = 100;
var markerLocs = [] //2d array which contains the marker locations in color height
var dragMarker = -1;
var dragView=false;
var imageSet = false;
var rotCanvas2=false;
var view3D=false;
var TubesIndex=0;

var img_data=[];
var scales=[];
var img_panels=[];
var color_panels=[];
var Tubes3DList=[];
var colormapFileNames=[];
var imgFileNames=[];
var tubesFileNames=[];
var LabSpaceColor=0;

var textCanvas = document.getElementById("text");
var ctx2 = textCanvas.getContext("2d");

var targ = document.getElementById("imageCanvas");
targ.width="50";
targ.height="50";

var orthogonal={
	l: 0,
	r: 1200,
	t: 0,
	b: -700
};
var orthoMatrix = makeOrtho(orthogonal.l, orthogonal.r, orthogonal.b, orthogonal.t, 0.1, 100.0);

/*WIP///////////////////////////////////////
var thumbnails={
	framebuffer: null,
	thumbnailTexture: null,
	size: null,
	maxSize: null,
	createThumbnail: function(obj){
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		size++;
		
		obj.drawInRect(x,y,w,h);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return id;
	}
	draw: function(id)
	
};
*//////////////////////////////////////////////////////////////
var viewports=[];

function updateViewportText(){
	var imgFileName;
	if(view3D)
		imageFileName = tubesFileNames[TubesIndex];
	else
		imageFileName = imgFileNames[imgIndex];
	var temp = canvas.height/2-20;
	ctx2.clearRect(receiveX+scaleWidth+100,0,temp,canvas.height);
	//Draw text within the view
	drawText(imageFileName,receiveX+scaleWidth+100,20);
	drawText(colormapFileNames[mapCIndices[0]],receiveX+scaleWidth+100,32);
	drawText(imageFileName,receiveX+scaleWidth+100,temp+40);
	drawText(colormapFileNames[mapCIndices[1]],receiveX+scaleWidth+100,temp+52);
}

function initView(){
	if(imageSet){
		return;
	}
	imageSet=true;
	if(!view3D){
		init2DView();
	}
	else{
		init3DView();
	}
	updateViewportText();
}

function moveView(x,y){
	if(!view3D){
		move2DView(x,y);
	}
	else{
		Rotate3DView(x,y);
	}
}
function scaleView(scalar){
	if(!view3D){
		scale2DView(scalar);
	}
	else{
		scale3DView(scalar);
	}
}

function drawView(){
	if(!view3D){
		draw2DView();
	}
	else{
		draw3DView();
	}
	updateViewportText();
}

var viewMatrix=Matrix.I(4);//2D
function init2DView(){
	var id=imgIndex;
	viewMatrix=(Matrix.Translation($V([0, 0, -1])).ensure4x4()).x(Matrix.Diagonal([img_data[id].w, img_data[id].h, 1,1]).ensure4x4());
	moveView((viewports[0].w-img_data[id].w)/2,(img_data[id].h-viewports[0].h)/2);
}

function move2DView(x,y){
	if(imgIndex<0) return;
	viewMatrix=Matrix.Translation($V([x,y,0])).ensure4x4().x(viewMatrix);
	
}
function scale2DView(scalar){
	if(imgIndex<0) return;
	var center=[viewports[0].w/2, viewports[0].h/2];
	moveView(-center[0],center[1]);
	viewMatrix=Matrix.Diagonal([scalar,scalar,1,1]).ensure4x4().x(viewMatrix);
	moveView(center[0],-center[1]);
}

function draw2DView(){
	if(img_panels[imgIndex]==null){
		return;
	}
	img_panels[imgIndex].changeColor(mapCIndices[0]);
	img_panels[imgIndex].drawInViewport(0);
	img_panels[imgIndex].changeColor(mapCIndices[1]);
	img_panels[imgIndex].drawInViewport(1);
}

var transform3D={
	degx:0,
	degy:0,
	scale:1
};
function init3DView(){
	transform3D.degx=0;
	transform3D.degy=0;
	transform3D.scale=1;
}

function Rotate3DView(x,y){
	if(TubesIndex<0) return;
	transform3D.degy+=x;
	transform3D.degx+=-y;
	if(transform3D.degy>=360)
		transform3D.degy-=360;
	else if(transform3D.degy<= -360)
		transform3D.degy+=360;
	if(transform3D.degx<-90)
		transform3D.degx=-90;
	else if(transform3D.degx>90)
		transform3D.degx=90;
}

function scale3DView(scalar){
	if(TubesIndex<0) return;
	transform3D.scale*=scalar;
}

function draw3DView(){
	if(Tubes3DList[TubesIndex]==null){
		return;
	}
	Tubes3DList[TubesIndex].changeColor(mapCIndices[0]);
	Tubes3DList[TubesIndex].drawInViewport(0);
	Tubes3DList[TubesIndex].changeColor(mapCIndices[1]);
	Tubes3DList[TubesIndex].drawInViewport(1);
}

var Viewport=function(x,y,w,h){
	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
	var self=this;
	this.clear=function(){
		var rectangle=Shape.rectangle;
		rectangle.scale(self.w+6,self.h+6);
		rectangle.move(self.x-3,self.y-3,0.5);
		rectangle.changeColor(0.0,0.0,0.0);
		rectangle.draw();
		clearRectangle(self.x,self.y+self.h,self.w,self.h);
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
	this.verticesBuffer=gl.createBuffer();
	this.verticesTexCoordBuffer=gl.createBuffer();
	this.texture=gl.createTexture();
	this.colormap=null;
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
				if(cID==null)
					self.colormap=null;
				else
					self.colormap=color_panels[cID].texture;
	};

	//### Drop encoding to alpha channel for background
	function EncodeFloatRGBA(f){
		if(f<0) return [0,0,0,0];
		if(f>=1.0) return [255,255,255,255];
		var r = ((256*f)|0)&255;
		var g = ((65536*f)|0)&255;
		var b = ((16777216*f)|0)&255;
		//var a = ((4294967296*f)|0)&255;
		//return [r,g,b,a];
		return [r,g,b,255];
	}
	
	function EncodeImgTexture(img){
		var len=img.length;
		var array=[];
		for (var i=0;i<len;i++){
			Array.prototype.push.apply(array, EncodeFloatRGBA(img[i]));
		}
		return new Uint8Array(array);
	}
	
	this.create=
		function(dID){
				var imageWidth= img_data[self.id].w;
				var imageHeight=img_data[self.id].h;
				var image2DArray=img_data[self.id].data;
				gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0,	0,-1,0, 1,0,0, 1,-1,0]), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
				
				gl.bindTexture(gl.TEXTURE_2D, self.texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageWidth, imageHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, EncodeImgTexture(image2DArray));
				setTexParameter();
		};
	this.create(this.id);
	this.changeColor(this.cindex);
	
	this.draw= 
		function(){
			if(lastShader!=="imgShader"){
				lastShader="imgShader";
				gl.useProgram(shaderProgram.imgShader);
				gl.enableVertexAttribArray(attributes.imgShader.vertexPositionAttribute);
				gl.enableVertexAttribArray(attributes.imgShader.vertexTexCoordAttribute);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
			gl.vertexAttribPointer(attributes.imgShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
			gl.vertexAttribPointer(attributes.imgShader.vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
			
			gl.uniform1i(uniforms.imgShader.uTexValLoc, 0);  // texture unit 0
			gl.uniform1i(uniforms.imgShader.uColormapLoc, 1);  // texture unit 1
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, self.texture);
			gl.activeTexture(gl.TEXTURE1);
			if(!self.colormap)
				gl.bindTexture(gl.TEXTURE_2D, defaultColor);
			else
				gl.bindTexture(gl.TEXTURE_2D, self.colormap);
			
			perspectiveMatrix = orthoMatrix;
			loadIdentity();	
			mvPushMatrix();
			mvTranslate([self.x, self.y, self.z-1.0]);
			mvScale([self.w,self.h,1]);
			setMatrixUniforms(uniforms.imgShader);
			
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			mvPopMatrix();
		};


	this.drawInViewport=function(vID){
		
		var viewp=viewports[vID];
		viewp.clear();
		gl.viewport(viewp.x, canvas.height-viewp.y-viewp.h, viewp.w, viewp.h);
		
		if(lastShader!=="imgShader"){
			lastShader="imgShader";
			gl.useProgram(shaderProgram.imgShader);
			gl.enableVertexAttribArray(attributes.imgShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.imgShader.vertexTexCoordAttribute);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(attributes.imgShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		gl.vertexAttribPointer(attributes.imgShader.vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
			
		gl.uniform1i(uniforms.imgShader.uTexValLoc, 0);  // texture unit 0
		gl.uniform1i(uniforms.imgShader.uColormapLoc, 1);  // texture unit 1
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, self.texture);
		gl.activeTexture(gl.TEXTURE1);
		if(!self.colormap)
			gl.bindTexture(gl.TEXTURE_2D, defaultColor);
		else
			gl.bindTexture(gl.TEXTURE_2D, self.colormap);
		
		perspectiveMatrix = makeOrtho(0, viewp.w, -viewp.h, 0, 0.1, 100.0);
			
		loadIdentity();	
		mvPushMatrix();
		multMatrix(viewMatrix);
		
		setMatrixUniforms(uniforms.imgShader);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		mvPopMatrix();
		
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
	this.verticesTexCoordBuffer=gl.createBuffer();
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
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0,	0,-1,0, 1,0,0, 1,-1,0]), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesTexCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 0,0, 1,1, 1,0]), gl.STATIC_DRAW);
		gl.bindTexture(gl.TEXTURE_2D, self.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scales[id].length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,flatten(scales[id]));
		setTexParameter();
	};
	this.create(cID);
	this.draw=function(){
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
};


var Tube=function(points){
	this.verticesBuffer=gl.createBuffer();
	this.verticesNormalBuffer=gl.createBuffer();
	this.verticesWeightBuffer=gl.createBuffer();
	this.verticesIndexBuffer=gl.createBuffer();
	var self=this;
	const PI=Math.PI;
	const radius=0.5;
	const numSlice=6;
	var vertices=[];
	var weights=[];
	var normals=[];
	var indices=[];
	var plen=points.length;
	this.ilen=null;
	
	//base
	var va=$V(points[0+1].position).subtract($V(points[0].position)).toUnitVector();
	if(va.e(1)!=0||va.e(2)!=0)
		var uu=va.cross($V([0,0,1])).toUnitVector();
	else
		var uu=va.cross($V([0,1,0])).toUnitVector();
	var vv=va.cross(uu).toUnitVector();
		
	for(var i=0;i<numSlice;i++){
		var angle=i*2*PI/numSlice;
		
		var normal=uu.x(Math.cos(angle)).add(vv.x(Math.sin(angle)));
		var vertex=$V(points[0].position).add(normal.multiply(radius));
	
		vertices.push(Number(vertex.e(1)));
		vertices.push(Number(vertex.e(2)));
		vertices.push(Number(vertex.e(3)));
		normals.push(Number(normal.e(1)));
		normals.push(Number(normal.e(2)));
		normals.push(Number(normal.e(3)));
		weights.push(Number(points[0].magnitude));
	}
	
	//mid 
	for(var c=1;c<points.length-1;c++){
		for(var i=0;i<numSlice;i++){
			var va=$V(points[c].position).subtract($V(points[c-1].position)).toUnitVector();
			var vb=$V(points[c+1].position).subtract($V(points[c].position)).toUnitVector();
			var vc=va.add(vb).toUnitVector();
			var nidx=((c-1)*numSlice+i)*3;
			var normal=vc.cross($V([normals[nidx],normals[nidx+1],normals[nidx+2]])).cross(vc).toUnitVector();
			var vertex=$V(points[c].position).add(normal.multiply(radius));
			
			vertices.push(Number(vertex.e(1)));
			vertices.push(Number(vertex.e(2)));
			vertices.push(Number(vertex.e(3)));
			normals.push(Number(normal.e(1)));
			normals.push(Number(normal.e(2)));
			normals.push(Number(normal.e(3)));
			weights.push(Number(points[c].magnitude));
		}
	}
	//top
	for(var i=0;i<numSlice;i++){
		var c=points.length-1;
		var va=$V(points[c].position).subtract($V(points[c-1].position)).toUnitVector();
		var nidx=((c-1)*numSlice+i)*3;
		var normal=va.cross($V([normals[nidx],normals[nidx+1],normals[nidx+2]])).cross(va).toUnitVector();
		var vertex=$V(points[c].position).add(normal.multiply(radius));
		
		vertices.push(Number(vertex.e(1)));
		vertices.push(Number(vertex.e(2)));
		vertices.push(Number(vertex.e(3)));
		normals.push(Number(normal.e(1)));
		normals.push(Number(normal.e(2)));
		normals.push(Number(normal.e(3)));
		weights.push(Number(points[c].magnitude));
	}
	
	
	//createIndices(plen,numSlice)
	var nx=0;
	var px=0;
	var up=true;
	while(nx<numSlice-1){
		if(indices.length>0){
			indices.pop();
			nx++;
		}
		if(up){
			for(var p=0;p<plen;p++){
				if(nx==numSlice-1){
					indices.push(p*numSlice+nx);
					indices.push(p*numSlice+0);
				}
				else{
					indices.push(p*numSlice+nx);
					indices.push(p*numSlice+nx+1);
				}
			}
			up=false;
		}
		else{
			for(var p=plen-1;p>=0;p--){
				if(nx==numSlice-1){
					indices.push(p*numSlice+nx);
					indices.push(p*numSlice+0);
				}
				else{
					indices.push(p*numSlice+nx);
					indices.push(p*numSlice+nx+1);
				}
			}
			up=true;
		}
	}
	this.ilen=indices.length;

	gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesWeightBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(weights), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	this.draw=function(){
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesBuffer);
		gl.vertexAttribPointer(attributes.tubeShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesNormalBuffer);
		gl.vertexAttribPointer(attributes.tubeShader.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
			
		gl.bindBuffer(gl.ARRAY_BUFFER, self.verticesWeightBuffer);
		gl.vertexAttribPointer(attributes.tubeShader.vertexWeightAttribute, 1, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.verticesIndexBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, self.ilen, gl.UNSIGNED_SHORT, 0);
	};
};//Tube
	
var Tubes3D = function(text){
	this.tubes=[];
	this.boundingBox={l:null,r:null,b:null,t:null,n:null,f:null};
	this.center=null;
	this.halfDimension=null;
	this.color=0;
	var self=this;
	//SVL_Split_Tubes(text)
	var lines=text.split("\n");
	
	var numTubes=Number(lines[0]);
	var i=1;
	for(var t=0;t<numTubes;t++){
		var numPoints=Number(lines[i]);
		i++;
		var points=[];
		for(var p=0;p<numPoints;p++){
			var point={};
			var lineData=lines[i].split(" ");
			var x=Number(lineData[0]);
			var y=Number(lineData[1]);
			var z=Number(lineData[2]);
			if(!this.boundingBox.l){
				this.boundingBox.l=x;
				this.boundingBox.r=x;
				this.boundingBox.b=y;
				this.boundingBox.t=y;
				this.boundingBox.n=-z;
				this.boundingBox.f=-z;
			}
			else{
				this.boundingBox.l=Math.min(this.boundingBox.l, x);
				this.boundingBox.r=Math.max(this.boundingBox.r, x);
				this.boundingBox.b=Math.min(this.boundingBox.b, y);
				this.boundingBox.t=Math.max(this.boundingBox.t, y);
				this.boundingBox.n=Math.min(this.boundingBox.n, -z);
				this.boundingBox.f=Math.max(this.boundingBox.f, -z);
			}
			point.position=[x,y,z];
			point.magnitude=Number(lineData[4]);
			points.push(point);
			i++;
		}
		this.tubes.push(new Tube(points));
	}
	this.center=[(this.boundingBox.l+this.boundingBox.r)/2,(this.boundingBox.t+this.boundingBox.b)/2,-(this.boundingBox.n+this.boundingBox.f)/2];
	this.halfDimension=Math.max(this.boundingBox.r-this.boundingBox.l,this.boundingBox.t-this.boundingBox.b,this.boundingBox.f-this.boundingBox.n)/2;
	this.changeColor=function(cID){
		self.color=cID;
	};
	//for thumbnail use
	this.draw=function(x,y,w,h){
		gl.viewport(x, canvas.height-y-h, w, h);
		if(lastShader!=="tubeShader"){
			lastShader="tubeShader";
			gl.useProgram(shaderProgram.tubeShader);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexNormalAttribute);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexWeightAttribute);
		}
		var viewMatrix3D = Matrix.I(4);
		
		gl.uniform1i(uniforms.tubeShader.uColormapLoc, 0); 
		gl.activeTexture(gl.TEXTURE0);

		gl.bindTexture(gl.TEXTURE_2D, defaultColor);
		
		perspectiveMatrix = makeOrtho(self.center[0]-self.halfDimension,self.center[0]+self.halfDimension,self.center[1]-self.halfDimension,self.center[1]+self.halfDimension,-10000,10000);
		
		gl.uniformMatrix4fv(uniforms.tubeShader.pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
		gl.uniformMatrix4fv(uniforms.tubeShader.mvUniform, false, new Float32Array(viewMatrix3D.flatten()));
		var tlen=self.tubes.length;
		for(var i=0;i<tlen;i++){
			self.tubes[i].draw();
		}
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
	this.drawInViewport=function(vID){
		var viewp=viewports[vID];
		viewp.clear();
		gl.viewport(viewp.x, canvas.height-viewp.y-viewp.h, viewp.w, viewp.h);
		
		if(lastShader!=="tubeShader"){
			lastShader="tubeShader";
			gl.useProgram(shaderProgram.tubeShader);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexPositionAttribute);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexNormalAttribute);
			gl.enableVertexAttribArray(attributes.tubeShader.vertexWeightAttribute);
		}
		
		var radx = transform3D.degx * Math.PI / 180.0;
		var rady = transform3D.degy * Math.PI / 180.0;
		var s=transform3D.scale;
		var viewMatrix3D = Matrix.Translation($V(this.center)).ensure4x4().x(Matrix.RotationX(radx).ensure4x4()).x(Matrix.RotationY(rady).ensure4x4()).x(Matrix.Diagonal([s,s,s,1]).ensure4x4()).x(Matrix.Translation($V([-this.center[0],-this.center[1],-this.center[2]])).ensure4x4());
		
		gl.uniform1i(uniforms.tubeShader.uColormapLoc, 0); 
		gl.activeTexture(gl.TEXTURE0);

		gl.bindTexture(gl.TEXTURE_2D, color_panels[self.color].texture);
		
		perspectiveMatrix = makeOrtho(self.center[0]-self.halfDimension,self.center[0]+self.halfDimension,self.center[1]-self.halfDimension,self.center[1]+self.halfDimension,-10000,10000);
		
		gl.uniformMatrix4fv(uniforms.tubeShader.pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
		gl.uniformMatrix4fv(uniforms.tubeShader.mvUniform, false, new Float32Array(viewMatrix3D.flatten()));
		var tlen=self.tubes.length;
		for(var i=0;i<tlen;i++){
			self.tubes[i].draw();
		}
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
};

var Shape={};
function start() {
	console.log("version:"+version);
	canvas = document.getElementById("glcanvas");
	canvas2 = document.getElementById("glcanvas2");
	canvas2.style.top="0px";
	canvas2.style.left=canvas.width+10+"px";
		initWebGL(canvas);      // Initialize the GL context
	  // Only continue if WebGL is available and working

	  if (gl) {
	  
		document.onmousedown = handleMouseDown;
		document.onmouseup = handleMouseUp;
		document.onmousemove = 	handleMouseMove;
		document.addEventListener("mousewheel", MouseWheelHandler, false);
		// Firefox
		document.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
		
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
		initBuffers();
		initMarkers();
		//initTextureFramebuffer();
		initShaders();
		initViewport();
		initShape();

		//setInterval(drawScene, 15);
		
		drawHelpText();
		
	  }
	  
	  
		imageCanvas=document.getElementById("imageCanvas");
		ctx=imageCanvas.getContext("2d");
}

function initViewport(){
	var temp = canvas.height/2-20;
	viewports.push(	new Viewport(receiveX+scaleWidth+100,10,temp,temp));
	viewports.push(	new Viewport(receiveX+scaleWidth+100,temp+30,temp,temp));
}

function initBuffers(){
	verticesBuffer = gl.createBuffer();
	verticesColorBuffer = gl.createBuffer();
	verticesBuffer2=gl2.createBuffer();
	verticesColorBuffer2=gl2.createBuffer();
	verticesIndexBuffer2=gl2.createBuffer();
	pointBuffer2=gl2.createBuffer();
	pointColorBuffer2=gl2.createBuffer();
	defaultColor=gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, defaultColor);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 129, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,blackWhite(129));
	setTexParameter();
}
function blackWhite(len){
	var array=[];
	var step=255/(len-1);
	for(var i=0;i<len;i++){
		var v=step*i;
		array.push(v);
		array.push(v);
		array.push(v);
		array.push(255);
	}
	return new Uint8Array(array);
}

function initMarkers(){
	for(var i=0;i<mapCIndices.length;i++){
		markerLocs[i] = [.2,.4,.6,.8];
	}
}

function setTexParameter(){
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

/////////////Not Done////////
function initTextureFramebuffer(){
	framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    Framebuffer.width = 512;
    Framebuffer.height = 512;
	thumbnailTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, thumbnailTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Framebuffer.width, Framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, Framebuffer.width, Framebuffer.height);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, thumbnailTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
	var img_vertexShader = getShader(gl, "img-shader-vs");
	var img_fragmentShader = getShader(gl, "img-shader-fs");
	shaderProgram.imgShader = gl.createProgram();
	gl.attachShader(shaderProgram.imgShader, img_vertexShader);
	gl.attachShader(shaderProgram.imgShader, img_fragmentShader);
	gl.linkProgram(shaderProgram.imgShader);
	if (!gl.getProgramParameter(shaderProgram.imgShader, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " );
	}
	attributes.imgShader={
		vertexPositionAttribute : gl.getAttribLocation(shaderProgram.imgShader, "aVertexPosition"),
		vertexTexCoordAttribute : gl.getAttribLocation(shaderProgram.imgShader, "aVertexTexCoord")
	};
	uniforms.imgShader={
		pUniform : gl.getUniformLocation(shaderProgram.imgShader, "uPMatrix"),
		mvUniform : gl.getUniformLocation(shaderProgram.imgShader, "uMVMatrix"),
		uTexValLoc : gl.getUniformLocation(shaderProgram.imgShader, "uTexVal"),
		uColormapLoc : gl.getUniformLocation(shaderProgram.imgShader, "uColormap")
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
	
	var tube_vertexShader = getShader(gl, "tube-shader-vs");
	var tube_fragmentShader = getShader(gl, "tube-shader-fs");
	shaderProgram.tubeShader = gl.createProgram();
	gl.attachShader(shaderProgram.tubeShader, tube_vertexShader);
	gl.attachShader(shaderProgram.tubeShader, tube_fragmentShader);
	gl.linkProgram(shaderProgram.tubeShader);
	if (!gl.getProgramParameter(shaderProgram.tubeShader, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: ");
	}
	attributes.tubeShader={
		vertexPositionAttribute : gl.getAttribLocation(shaderProgram.tubeShader, "aVertexPosition"),
		vertexNormalAttribute : gl.getAttribLocation(shaderProgram.tubeShader, "aVertexNormal"),
		vertexWeightAttribute : gl.getAttribLocation(shaderProgram.tubeShader, "aVertexWeight")
	};
	uniforms.tubeShader={
		pUniform : gl.getUniformLocation(shaderProgram.tubeShader, "uPMatrix"),
		mvUniform : gl.getUniformLocation(shaderProgram.tubeShader, "uMVMatrix"),
		uColormapLoc : gl.getUniformLocation(shaderProgram.tubeShader, "uColormap")
	};
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

function testResetButtonHit(mouseX,mouseY){
	if(mouseX>resetIconX&&mouseX<resetIconX+60){
		if(mouseY>resetIconY&&mouseY<resetIconY+20){
			return true;
		}
	}
	return false;
}

function generateThumbnail(){
	
}

function testImageIconHit(mouseX,mouseY){
	//First test x value
	if(mouseX<imgIconX+10||mouseX>imgIconX+10+iconWidth){
		return -1;
	}
	//Test y values
	for(var i=0;i<img_data.length+Tubes3DList.length;i++){
		if(mouseY>imgIconY+10+i*(iconHeight+10)&&mouseY<imgIconY+10+iconHeight+i*(iconHeight+10)){
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
			return scale*markerLocs[0].length+i;
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
	//First test x value
	if(mouseX<iconX+10||mouseX>iconX+10+iconWidth){
		return -1;
	}
	//Test y values
	for(var i=0;i<scales.length;i++){
		if(mouseY>iconY+10+i*(iconHeight+10)-iconViewOffset&&mouseY<iconY+10+iconHeight+i*(iconHeight+10)-iconViewOffset){
			return i;
		}
	}
	return -1;
}

//test if mouse is in image viewport
function testViewportHit(mouse){
	for(var i=0;i<viewports.length;i++){
		var viewp=viewports[i];
		if(mouse.x>viewp.x&&mouse.x<viewp.x+viewp.w&&mouse.y>viewp.y&&mouse.y<viewp.y+viewp.h){
			return true;
		}
	}
	return false;
	
}

function testCanvas2Hit(mouse){
	var c2left=canvas2.style.left.slice(0,-2);
	var c2top=canvas2.style.top.slice(0,-2);
	if(mouse.x>c2left&&mouse.x<c2left+canvas2.width&&mouse.y>c2top&&mouse.y<c2top+canvas2.height){
		return true;
	}
	return false;
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
	var tempx=imgIconX+10;
	var tempy=imgIconY+(iconHeight+10)*iindex+10;
	return [tempx,tempy];
}

function getIconxy(cindex){
	var tempx=iconX+10;
	var tempy=iconY+(iconHeight+10)*cindex+10-iconViewOffset;
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
	//Test if resetbutton was pressed
	if(testResetButtonHit(mouse.x,mouse.y)&&img_panels.length!=0){
		imageSet=false;
		initView();
		drawView();
	}
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
		drawPanels();
		drawMarkers();
		drawInfoBoxes();
	}
	
	if(dragIcon>=0){
		var tempxy;
		if(dragIcon<10000){
			tempxy=getIconxy(dragIcon);
			LabSpaceColor=dragIcon;
			drawLabSpace();
		}
		else{
			tempxy=getImageIconxy(dragIcon);
		}
		createImage(tempxy[0],tempxy[1],iconWidth,iconHeight);
		targ.style.left=mouse.x-iconWidth/2+'px';
		targ.style.top=mouse.y-iconHeight/2+'px';
		targ.style.display="inline";
	}
	
	if(testCanvas2Hit(mouse)){
		rotCanvas2=true;
	}
	else if(testViewportHit(mouse)){
		dragView=true;
	}
	
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
		var temp = dragIcon-10000;
		if(temp<img_panels.length){
			TubesIndex=-1;
			imgIndex=temp;
			view3D = false;
		}
		else{
			TubesIndex=temp-img_panels.length;
			imgIndex=-1;
			view3D = true;
		}
		initView();
		drawView();
	}
	dragIcon=-1;
	dragMarker=-1;
	clearDrag();
	rotCanvas2=false;
	dragView=false;
}

//Called when the mouse moves
function handleMouseMove(event){
	var mouse = getMousePos(canvas, event);
	updateFilenameIndicator(mouse.x,mouse.y);
	if(rotCanvas2){
		rotateT2(mouse.x-lastMouseX,lastMouseY-mouse.y);
		drawLabSpace();
	}
	else if(dragView){
		moveView(mouse.x-lastMouseX,lastMouseY-mouse.y);
		drawView();
	}
	else if(dragIcon==-1&&dragMarker==-1){
		return;
	}
	if(dragIcon>=0){
		targ.style.left=mouse.x-iconWidth/2+'px';
		targ.style.top=mouse.y-iconHeight/2+'px';
	}
	
	
	if(dragIcon==-2&&iconViewHeight<scales.length*60+10){
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

function MouseWheelHandler(e) {
	var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	var mouse = getMousePos(canvas,e);
	if(testCanvas2Hit(mouse)){
		if(delta>0)
			scaleT2(1.1);
		else if(delta<0)
			scaleT2(0.9);
		drawLabSpace();
		event.preventDefault();
		event.returnValue=false;
	}
	else if(testViewportHit(mouse)){
		if(delta>0)
			scaleView(1.1);
		else if(delta<0)
			scaleView(0.9);
		drawView();
		event.preventDefault();
		event.returnValue=false;
	}
	else if(testIconViewHit(mouse.x,mouse.y)){
		if(iconViewHeight<scales.length*60+10){
			if(delta>0)
				scrollIconView(-15);
			else if(delta<0)
				scrollIconView(15);
			drawColorThumbnails();
		}
		event.preventDefault();
		event.returnValue=false;
	}
	return false;
}

function scrollIconView(delta){
	iconViewOffset = iconViewOffset+delta;
	if(iconViewOffset<0){
		iconViewOffset=0;
	}
	if(0<scales.length*60-iconViewHeight+10&&iconViewOffset>scales.length*60-iconViewHeight+10){
		iconViewOffset=scales.length*60-iconViewHeight+10;
	}
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
	targ.style.display="none";
}

function updateMarkerLoc(mouseX,mouseY){
	var dx=lastMouseX-mouseX;
	var scaleIndex = Math.floor(dragMarker/markerLocs[0].length);
	var markerIndex = dragMarker%markerLocs[0].length;
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
	var dy=lastMouseY-mouseY;
	scrollIconView(dy);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
	gl.clearColor(.5, .5, .5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	drawImgIcons();
	if(img_panels.length!=0&&color_panels.length>1){
		//initialize and draw img in viewports
		initView();
		drawView();
	}
	
	drawColorThumbnails();
	//drawReceiveThumbnails();
	drawPanels();
	drawGraphs();
	drawMarkers();
	drawInfoBoxes();
	//drawLine(0,0,400,400,{r:100,g:100,b:100});
	drawResetIcon();
	
}

function drawHelpText(){
	//Draw notifications for drag and drop
	drawText("Drag new color maps",iconX-24,iconY+iconViewHeight+15);
	drawText("into the box above",iconX-20,iconY+iconViewHeight+29);
	
	drawText("Drag new image files",imgIconX-34,imgIconY+iconViewHeight+15);
	drawText("into the box above",imgIconX-30,imgIconY+iconViewHeight+29);
}

function drawResetIcon(){
	var rectangle=Shape.rectangle;
	rectangle.scale(60,20);
	rectangle.move(resetIconX,resetIconY,0.5);
	rectangle.changeColor(1.0,0.0,0.0);
	rectangle.draw();
	drawText("RESET",resetIconX+7,resetIconY+15);
}

function drawImgIcons(){
	//Draw the border for the img icons
	var rectangle=Shape.rectangle;
	rectangle.scale(iconViewWidth+6,iconViewHeight+6);
	rectangle.move(imgIconX-3,imgIconY-3,0.5);
	rectangle.changeColor(0.0,0.0,0.0);
	rectangle.draw();
	
	clearRectangle(imgIconX,imgIconY+iconViewHeight,iconViewWidth,iconViewHeight);
	for(var i=0;i<img_panels.length;i++){
			img_panels[i].changeColor(null);
			img_panels[i].scale(iconWidth, iconHeight);
			img_panels[i].move(imgIconX+10,i*(iconHeight+10)+imgIconY+10,0);
			img_panels[i].draw();
		}
	for(var i=0;i<Tubes3DList.length;i++){
			Tubes3DList[i].draw(imgIconX+10,(i+img_panels.length)*(iconHeight+10)+imgIconY+10,iconWidth, iconHeight);
		}
}

function drawLine(x,y,x2,y2,color){
	if(lastShader!=="simple"){
		lastShader="simple";
		gl.useProgram(shaderProgram.simpleShader);
		gl.enableVertexAttribArray(attributes.simpleShader.vertexPositionAttribute);
		gl.enableVertexAttribArray(attributes.simpleShader.vertexColorAttribute);
	}
	
	var thickness=1;
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x-thickness,-y,-1,	x+thickness,-y,-1,	x2+thickness,-y2,-1, x2-thickness,-y2,-1]), gl.STATIC_DRAW);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([color.r,color.g,color.b,1,	color.r,color.g,color.b,1, color.r,color.g,color.b,1,	color.r,color.g,color.b,1]), gl.STATIC_DRAW);

	perspectiveMatrix = orthoMatrix;
	
	
	loadIdentity();
	mvPushMatrix();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.vertexAttribPointer(attributes.simpleShader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
	gl.vertexAttribPointer(attributes.simpleShader.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	mvPopMatrix();
}


function drawInfoBoxes(){
	var rectangle=Shape.rectangle;
	
	//Clear the area the lines go in
	clearRectangle(receiveX-5,receiveY+scaleHeight+30,scaleWidth+10,30);
	drawInfoBox(scaleWidth*.0+receiveX,receiveY+scaleHeight+30,0,0,1);
	drawInfoBox(scaleWidth*.55+receiveX,receiveY+scaleHeight+30,0,2,3);
	drawText("-RGB-",receiveX+scaleWidth/2-20,receiveY+scaleHeight+30+25);
	drawText("-LAB-",receiveX+scaleWidth/2-20,receiveY+scaleHeight+30+45);
	ctx2.clearRect(receiveX,receiveY,scaleWidth,scaleHeight);
	drawText(colormapFileNames[mapCIndices[0]],receiveX+10,receiveY+scaleHeight/4);
	rectangle.scale(scaleWidth*.095,75);
	rectangle.move(receiveX+scaleWidth/2-19,receiveY+scaleHeight+30);
	rectangle.changeColor(.9,.9,.9);
	rectangle.draw();
	
	//Clear the area the lines go in
	clearRectangle(receiveX-5,receiveY+scaleHeight+30+receiveDelta,scaleWidth+10,30);
	drawInfoBox(scaleWidth*.0+receiveX,receiveY+scaleHeight+30+receiveDelta,1,0,1);
	drawInfoBox(scaleWidth*.55+receiveX,receiveY+scaleHeight+30+receiveDelta,1,2,3);
	drawText("-RGB-",receiveX+scaleWidth/2-20,receiveY+scaleHeight+receiveDelta+30+25);
	drawText("-LAB-",receiveX+scaleWidth/2-20,receiveY+scaleHeight+receiveDelta+30+45);
	ctx2.clearRect(receiveX,receiveY+receiveDelta,scaleWidth,scaleHeight);
	drawText(colormapFileNames[mapCIndices[1]],receiveX+10,receiveY+receiveDelta+scaleHeight/4);
	rectangle.scale(scaleWidth*.095,75);
	rectangle.move(receiveX+scaleWidth/2-19,receiveY+scaleHeight+receiveDelta+30);
	rectangle.changeColor(.9,.9,.9);
	rectangle.draw();
	
}

function drawInfoBox(x,y,graphIndex, marker1, marker2){
	
	if(mapCIndices[graphIndex]>=scales.length){
		return;
	}
	var rectangle=Shape.rectangle;
	var width = scaleWidth*.45;
	var height = 75;
	ctx2.clearRect(x,y,width,height);
	rectangle.scale(width,height);
	rectangle.move(x,y);
	rectangle.changeColor(1,1,1);
	rectangle.draw();
	
	//Draw lines to the markers
	var marker1Loc = markerLocs[graphIndex][marker1];
	var marker2Loc = markerLocs[graphIndex][marker2];
	var color1 = getColorHeight(mapCIndices[graphIndex],marker1Loc);
	var color2 = getColorHeight(mapCIndices[graphIndex],marker2Loc);
	
	drawLine(receiveX+scaleWidth*marker1Loc,receiveY+scaleHeight+receiveDelta*graphIndex,x,y,color1);
	drawLine(receiveX+scaleWidth*marker2Loc,receiveY+scaleHeight+receiveDelta*graphIndex,x+width,y,color2);
	
	//Draw color boxes
	rectangle.scale(width/2-2,6);
	rectangle.changeColor(color1.r,color1.g,color1.b);
	rectangle.move(x+2,y+2);
	rectangle.draw();
	rectangle.changeColor(color2.r,color2.g,color2.b);
	rectangle.move(x+width/2,y+2);
	rectangle.draw();
	//write rgb values
	drawText(Math.round(color1.r*255)+" "+Math.round(color1.g*255)+" "+Math.round(color1.b*255),x+2,y+25);
	drawText(Math.round(color2.r*255)+" "+Math.round(color2.g*255)+" "+Math.round(color2.b*255),x+width/2+2,y+25);
	
	//write lab values
	var lab1=rgb_to_lab({'R':color1.r*255, 'G':color1.g*255, 'B':color1.b*255});
	var lab2=rgb_to_lab({'R':color2.r*255, 'G':color2.g*255, 'B':color2.b*255});
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
		if((iconHeight+10)*i+10-iconViewOffset+iconHeight<0||(iconHeight+10)*i+10-iconViewOffset>iconViewHeight){
			continue;
		}
		drawThumbnail(iconX+10,iconY+(iconHeight+10)*i+10-iconViewOffset,i);
	}
	
	//Draw the borders
	drawColorView();
	
	//Clear the edges
	clearRectangle(iconX,iconY-3,iconViewWidth,iconHeight+3);
	clearRectangle(iconX,iconY+iconViewHeight+iconHeight+6,iconViewWidth,iconHeight+3);
}

function drawThumbnail(x,y,cindex){
	color_panels[cindex].scale(iconWidth,iconHeight);
	color_panels[cindex].move(x,y);
	color_panels[cindex].draw();
}

var pMatrix2=makeOrtho(-300,300,-300,300,-1000,1000);
var lastShader2;
var transform2={
	degx: 0,
	degy: 0,
	scale: 1
};

function initT2(){
	transform2.degx=0;
	transform2.degy=0;
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
var tempid;
function drawLabSpace(){
	gl2.clearColor(.5, .5, .5, 1);
	gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);
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
	var len=scales[LabSpaceColor].length;

	
	if(tempid!=LabSpaceColor){
		tempid=LabSpaceColor;
		var scale=scales[LabSpaceColor];
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
		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_pos), gl2.STATIC_DRAW);
		gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2);
		gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(list_rgba), gl2.STATIC_DRAW);
	}

	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointBuffer2);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexPositionAttribute, 3, gl2.FLOAT, false, 0, 0);
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointColorBuffer2);
	gl2.vertexAttribPointer(attributes.simpleShader2.vertexColorAttribute, 4, gl2.FLOAT, false, 0, 0);
	
	gl2.drawArrays(gl2.POINTS, 0, len);
	
}

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

function setMatrixUniforms(shader) {
	if(!shader)
		shader = uniforms.simpleShader;
  gl.uniformMatrix4fv(shader.pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
  gl.uniformMatrix4fv(shader.mvUniform, false, new Float32Array(mvMatrix.flatten()));
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

$(document).on('load',FileListenerInit());
function FileListenerInit(){
	if(window.FileReader) {
		addEventHandler(window, 'load', function() {
			var drop1  = document.getElementById('drop1');
			var drop2 = document.getElementById('drop2');
			var select1 = document.getElementById('selector1');
			var select2 = document.getElementById('selector2');
			var select3 = document.getElementById('selector3');
			
			drop1.style.left= imgIconX-1+'px';
			drop1.style.top= imgIconY-1+"px";
			drop1.style.width=iconViewWidth+"px";
			drop1.style.height=iconViewHeight+"px";
			drop1.style.position= 'absolute';
			
			drop2.style.left= iconX-1+'px';
			drop2.style.top= iconY-1+"px";
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
			addEventHandler(select3,'change', handleTubesFileSelect);
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
			else if(type=='tubes'){
				readTextToTubes(e2.target.result,this.file.name);
			}
		}
		reader.readAsText(file); // start reading the file data.
	}
}

$(document).on("load",readFilesOnLoad());

function readFilesOnLoad(){
	readFilesFromServer("./data/colorscale/","scale");
	readFilesFromServer("./data/image/","image");
}

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
		else if(type=="tubes"){
			readTextToTubes(text,filename);
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
	if(lines[lines.length-1]==""||lines[lines.length-1]=="\r")lines.pop();
	imageHeight=lines.length;
	for(var i=0;i<lines.length;i++) {
		var values=lines[i].split(' ');
		if(values[values.length-1]=="\r"||values[values.length-1]=="")values.pop();
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
		data: fillBackground(image2DArray,imageWidth,imageHeight)
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
function readTextToTubes(text,filename){
	Tubes3DList.push(new Tubes3D(text));
	tubesFileNames.push(filename);
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
function handleTubesFileSelect(evt){
	var files = evt.target.files;
    readFiles(files,"tubes");
}

//change background 0 to -1
function fillBackground(data0,w,h){ //data = 2d array flattened to 1d
	console.log("width and height:"+w+","+h);
	var data=data0;
	var spreadable=[];
	const bg=-1;
	//mark the 4 corners as spreadable
	if(data[(0)+(0)*w]===0){
		data[(0)+(0)*w]=bg;
		spreadable.push([0,0]);
	}
	if(data[(0)+(h-1)*w]===0){
		data[(0)*h+(h-1)]=bg;
		spreadable.push([0,h-1]);
	}
	if(data[(w-1)+(0)*w]===0){
		data[(w-1)+(0)*w]=bg;
		spreadable.push([w-1,0]);
	}
	if(data[(w-1)+(h-1)*w]===0){
		data[(w-1)+(h-1)*w]=bg;
		spreadable.push([w-1,h-1]);
	}
	
	while(spreadable.length>0){
		var spread=spreadable.pop();
		var x=spread[0];
		var y=spread[1];
		//check neighbor empty
		if(data[(x)+(y+1)*w]>0 || data[(x)+(y-1)*w]>0 || data[(x+1)+(y)*w]> 0|| data[(x-1)+(y)*w]>0){
			continue;
		}
		
		//spread upward
		if(y+1<h && data[(x)+(y+1)*w]===0){
			data[(x)+(y+1)*w]=bg;
			spreadable.push([x,y+1]);
		}
		//spread downward
		if(y-1>=0 && data[(x)+(y-1)*w]===0){
			data[(x)+(y-1)*w]=bg;
			spreadable.push([x,y-1]);
		}
		//spread right
		if(x+1<w && data[(x+1)+(y)*w]===0){
			data[(x+1)+(y)*w]=bg;
			spreadable.push([x+1,y]);
		}
		//spread left
		if(x-1>=0 && data[(x-1)+(y)*w]===0){
			data[(x-1)+(y)*w]=bg;
			spreadable.push([x-1,y]);
		}
	}
	return data;
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
	var labref=rgb_to_lab({'R':cref.r*255, 'G':cref.g*255, 'B':cref.b*255});
	
	rect.changeColor(cref.r,cref.g,cref.b);
	for(var i=0; i<len; i++){
		var barWidth=w/len;
		var color=getColorHeight(cID,i/len);
		var lab=rgb_to_lab({'R':color.r*255, 'G':color.g*255, 'B':color.b*255});
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