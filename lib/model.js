var canvas;
var gl;

var mvMatrix;
var perspectiveMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexNormalAttribute;
var vertexWeightAttribute;

var verticesPositionBuffer;
var verticesNormalBuffer;
var verticesIndexBuffer;


var Tubes=[];

var Tube=function(points){
	this.points=points;//[x,y,z],magnitude
	this.verticesPositionBuffer=gl.createBuffer();
	this.verticesNormalBuffer=gl.createBuffer();
	this.verticesWeightBuffer=gl.createBuffer();
	this.indices=gl.createBuffer();
	this.boundingBox={};


	var vertices=[];
	var weights=[];
	var normals=[];
	var indices=[];

	const PI=Math.PI;
	const radius=2;
	const numSlice=6;
	


		
		for(var i=0;i<numSlice;i++){
			var angle=i*2*PI/numSlice;
			var va=$V(points[0+1].position).substract($V(points[0].position)).toUnitVector();
			if(va.e(1)!=0||va.e(2)!=0)
				var uu=va.cross($V[0,0,1]).toUnitVector();
			else
				var uu=va.cross($V[0,1,0]).toUnitVector();
			var vv=va.cross(uu).toUnitVector();
			
			var normal=Math.cos(angle)*uu + Math.sin(angle)*vv;
			var vertex=$V(points[0].position).add(normal.multiply(radius));
				
			vertices.push(vertex.e(1));
			vertices.push(vertex.e(2));
			vertices.push(vertex.e(3));
			normals.push(normal.e(1));
			normals.push(normal.e(2));
			normals.push(normal.e(3));
			weights.push(points[0].magnitude);
		}
			
		for(var c=1;c<points.length-1;c++){
			for(var i=0;i<numSlice;i++){

				var va=$V(points[c].position).substract($V(points[c-1].position)).toUnitVector();
				var vb=$V(points[c+1].position).substract($V(points[c].position)).toUnitVector();
				var vc=va.add(vb).toUnitVector();
				var nidx=((c-1)*numSlice+i)*3;
				var normal=vc.cross($V(normals[nidx],normals[nidx+1],normals[nidx+2])).cross(vc).toUnitVector();
				var vertex=$V(points[c].position).add(normal.multiply(radius));
				
				vertices.push(vertex.e(1));
				vertices.push(vertex.e(2));
				vertices.push(vertex.e(3));
				normals.push(normal.e(1));
				normals.push(normal.e(2));
				normals.push(normal.e(3));
				weights.push(points[c].magnitude);
			}
		}
		
		for(var i=0;i<numSlice;i++){

			var c=points.length-1;
			var va=$V(points[c].position).substract($V(points[c-1].position)).toUnitVector();
			var normal=va.cross(normals[(c-1)*numSlice+i]).cross(va).toUnitVector();
			var vertex=$V(points[c].position).add(normal.multiply(radius));
				
			vertices.push(vertex.e(1));
			vertices.push(vertex.e(2));
			vertices.push(vertex.e(3));
			normals.push(normal.e(1));
			normals.push(normal.e(2));
			normals.push(normal.e(3));
			weights.push(points[c].magnitude);
		}
	
	
	//function createIndices(plen,numslice){

		var plen=plen;
		var vlen=plen*numslice;
		
		var nx=0;
		var px=0;
		var up=true;
		while(nx<numslice-1){
			if(indices.length>0){
				indices.pop();
				nx++;
			}
			if(up){
				for(var p=0;p<plen;p++){
					if(nx==numslice-1){
						indices.push(p*numslice+nx);
						indices.push(p*numslice+0);
					}
					else{
						indices.push(p*numslice+nx);
						indices.push(p*numslice+nx+1);
					}
				}
				up=false;
			}
			else{
				for(var p=plen-1;p>=0;p--){
					if(nx==numslice-1){
						indices.push(p*numslice+nx);
						indices.push(p*numslice+0);
					}
					else{
						indices.push(p*numslice+nx);
						indices.push(p*numslice+nx+1);
					}
				}
				up=true;
			}
		}
	//}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, verticesNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesWeightBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(weights), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	
	//create vertices buffer
	
	
	this.changeColor=function(id){};
	//this.
};

function SVL_Split_Tubes(text){
	var lines=text.split("\n");
	var i=0;
	var numTubes=Number(lines[0]);
	i++;
	for(var t=0;t<numTubes;t++){
		var numPoints=Number(lines[i]);
		i++;
		var points=[];
		for(var p=0;p<numPoints;p++){
			var point={};
			var lineData=line[i].split(" ");
			point.position=[lineData[0],lineData[1],lineData[2]];
			point.magnitude=lineData[4];
			points.push(point);
			i++;
		}
		Tubes.push(new Tube(points));
	}
}


function start() {
	  canvas = document.getElementById("glcanvas");

	  initWebGL(canvas); 
	  if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0); 
		gl.clearDepth(1.0);                 
		gl.enable(gl.DEPTH_TEST);           
		gl.depthFunc(gl.LEQUAL);            

		initShaders();
		
		initModel();
		
		setInterval(drawScene, 15);
		//drawScene();
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
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(vertexNormalAttribute);
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  
  }


  gl.shaderSource(shader, theSource);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

const PI=3.14159265359;
var c1= $V([0,0,0]);
var c2= $V([0,5,0]);
var centers=[c1,c2];
var radius=2;
var numSlice=6;

var vertices=[];
var normals=[];
var indices;
	
function initModel(){
	verticesPositionBuffer=gl.createBuffer();
	verticesNormalBuffer=gl.createBuffer();
	verticesIndexBuffer = gl.createBuffer();
	
	
	
	for(c=0;c<centers.length;c++){
		for(var i=0;i<numSlice;i++){
			var angle=i*2*PI/numSlice;
			var normal=$V([Math.cos(angle),0,Math.sin(angle)]).toUnitVector();
			var vertex=centers[c].add(normal.multiply(radius));
			vertices.push(vertex.e(1));
			vertices.push(vertex.e(2));
			vertices.push(vertex.e(3));
			normals.push(normal.e(1));
			normals.push(normal.e(2));
			normals.push(normal.e(3));
		}
	}
					
	indices=[	0,6,1,7,2,8,3,9,4,10,5,11,0,6];

	gl.bindBuffer(gl.ARRAY_BUFFER, verticesPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, verticesNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}
var angle=0;
function drawScene(){
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	perspectiveMatrix = makeOrtho(-10, 10, -10, 10, -0.1, 100.0);
	
	loadIdentity();	
	
	mvPushMatrix();
	mvTranslate([-0.0, 0.0, -6.0]);
	mvRotate(angle,[1,0,0]);
	mvRotate(angle,[0,0,1]);


	gl.bindBuffer(gl.ARRAY_BUFFER, verticesNormalBuffer);
	gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesPositionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLE_STRIP, indices.length ,gl.UNSIGNED_SHORT,0);
	mvPopMatrix();
	angle+=1;
}
	

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