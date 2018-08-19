// ########################## SHADER ##########################

var vertexShaderCubeText = 
`#version 300 es
	
	in vec3 vertPosition;
	in vec3 vertNormal;
	in vec4 vertColor;

	out vec3 outPosition;
	out vec3 fragNormal;
	out vec3 fragPosition;
	out vec4 outColor;

	uniform int u_selection;
	uniform mat3 uNormalMatrix;
	uniform mat4 uModelMatrix;
	uniform mat4 mWorld;

	void main()
	{
		gl_Position = mWorld * vec4(vertPosition, 1.0);
		outPosition = vertPosition;
		
		fragPosition = vec3(uModelMatrix * vec4(vertPosition, 1.0));
		fragNormal = normalize(uNormalMatrix * vertNormal);
		
		float alpha = (int(vertColor.a) == u_selection) ? 0.75 : 1.0;

		if(u_selection == 0) //Init.
			outColor = vec4(vertColor.rgb, vertColor.a/255.0);
		else
			outColor = vec4(vertColor.rgb, alpha);
	}
`;

var fragmentShaderCubeText =
`#version 300 es

	precision mediump float;

	in vec3 outPosition;
	in vec3 fragNormal;
	in vec3 fragPosition;
	in vec4 outColor;
	
	out vec4 fragColor;
	
	uniform int uDrawLines;
	uniform vec3 uAmbientLight;
	uniform vec3 uDiffuseLight;
	uniform vec3 uLightPosition;

	void main()
	{
		if(uDrawLines == 0)
		{
			vec3 sunlightDirection = normalize(uLightPosition - fragPosition);
			float nDotL = max(dot(sunlightDirection, fragNormal), 0.0);
			vec3 diffuse = uDiffuseLight * outColor.rgb * nDotL;
			vec3 ambient = uAmbientLight * outColor.rgb;

			if(abs(outPosition.x) == 1.0 || abs(outPosition.y) == 1.0 || abs(outPosition.z) == 1.0)
				fragColor = vec4(diffuse + ambient, outColor.a);
			else
				fragColor = vec4(0.0, 0.0, 0.0, 1.0);
		}
		else
			fragColor = outColor;
	}
`;

var vertexShaderSkyText = 
`#version 300 es

	in vec3 vertPosition;
	out vec3 vertTexCoord;
	uniform mat4 mWorld;
	
	void main()
	{
		vertTexCoord = vertPosition;
		gl_Position = mWorld * vec4(vertPosition, 1.0);
	}
`;

var fragmentShaderSkyText =
`#version 300 es

	precision mediump float;

	in vec3 vertTexCoord;
	out vec4 fragColor;
	uniform samplerCube cubemap;

	void main()
	{
		fragColor = texture(cubemap, vertTexCoord);
	}
`;

// ########################## GLOBALS ##########################

var viewProjMatrix = new Float32Array(16);
var pixels = new Uint8Array(4);
var zoom = 1;

var old_mouse_move_x, new_mouse_move_x;
var old_mouse_move_y, new_mouse_move_y;

var mouseClicked_left = false;
var mouseClicked_right = false;

var cubeSelected = false;

var move_angle_x = -0.75;
var move_angle_y = 0.40;

var rotationActive = false;
var rotationDirection;
var rotationAxis = 0;

// Cube- and axiscolors
var red = 	 [ 200/255,  18/255,  52/255 ], green =  [   0/255, 155/255,  72/255 ], blue = 	 [   0/255,  70/255, 173/255 ];
var orange = [ 255/255,  88/255,   0/255 ], white =  [ 240/255, 240/255, 240/255 ], yellow = [ 255/255, 213/255,   0/255 ];
var xAxisColor =  [ 1.0, 0.0, 1.0 ], yAxisColor =  [ 1.0, 1.0, 1.0 ], zAxisColor =  [ 1.0, 1.0, 1.0 ];

var subCubes = new Array(3)
for(var i = 0; i < 3; i++)
	subCubes[i] = new Array(3);
for(var i = 0; i < 3; i++)
	for(var j = 0; j < 3; j++)
		subCubes[i][j] = new Array(3);

// ########################## Class: SubCube ##########################
	
class SubCube 
{	
	constructor(_subCubeIndex, _vertexBuffer, _indexBuffer) 
	{
		this.subCubeIndex = _subCubeIndex; // Verändert sich bei Drehung
		this.subCubePosID = _subCubeIndex; // Verändert nicht bei Drehung
		
		this.vertexBuffer = new Float32Array(240);
		this.vertexBuffer = _vertexBuffer;
		
		this.indexBuffer = new Uint16Array(36);
		this.indexBuffer = _indexBuffer;
		
		this.uSubCubeMatrix = new Float32Array(16);
		this.rotatedMatrix = mat4.create();
		mat4.multiply(this.uSubCubeMatrix, viewProjMatrix, this.rotatedMatrix); //Init.
		
		this.rotationCount = 0;
	}
  
	copyValues(object)
	{
		this.subCubeIndex = object.subCubeIndex;
		
		for(var i = 0; i < 240; i++)
			this.vertexBuffer[i] = object.vertexBuffer[i];
		  
		for(var i = 0; i < 36; i++)
			this.indexBuffer[i] = object.indexBuffer[i];
		  
		for(var i = 0; i < 16; i++)
			this.uSubCubeMatrix[i] = object.uSubCubeMatrix[i];
		
		this.rotatedMatrix = object.rotatedMatrix;
	}
  
	transformSubCube(_rotationAxis, _rotationDirection)
	{		
		var newRotatedMatrix = mat4.create();
		
		if(_rotationAxis == 0) //Rotation around X-Axis
			mat4.rotateX(newRotatedMatrix, newRotatedMatrix, _rotationDirection*(Math.PI/2)/10);		
					
		if(_rotationAxis == 1) //Rotation around Y-Axis
			mat4.rotateY(newRotatedMatrix, newRotatedMatrix, _rotationDirection*(Math.PI/2)/10);	
			
		if(_rotationAxis == 2) //Rotation around Z-Axis
			mat4.rotateZ(newRotatedMatrix, newRotatedMatrix, _rotationDirection*(Math.PI/2)/10);	

		mat4.multiply(this.rotatedMatrix, newRotatedMatrix, this.rotatedMatrix);	
		
		if(++this.rotationCount == 10)
		{
			this.rotationCount = 0;
			rotationActive = false;
		}	
	}
}

function drawCube() 
{
	// Init. WebGL Context
	var canvas = document.getElementById("DrawCubeCanvas");
	var gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true}, {antialias: true});
	
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight-50;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	document.getElementById("rotAxisText").innerHTML = "X-Axis";
	
	// Set Canvas Color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	
// ########################## LISTENER & HANDLER ##########################

	// Mouse-EventListener
	canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
	canvas.addEventListener("mousedown", MouseDownHandler, false);
	canvas.addEventListener("mouseup", MouseUpHandler, false);
	canvas.addEventListener("mousemove", MouseMoveHandler, false);
	
	// Keyboard-EventListener
	window.addEventListener("keydown", KeyDownHandler, false);
	
	function KeyDownHandler(e)
	{
		if(rotationActive == false)
		{
			if((e.keyCode == 37 || e.keyCode == 65) && cubeSelected == true)
			{// left arrow or a-key
				rotationDirection = 1;
				rotationActive = true;
			}
			
			if((e.keyCode == 39 || e.keyCode ==  68) && cubeSelected == true)
			{// right arrow or d-key
				rotationDirection = -1;
				rotationActive = true;
			}
			
			if(e.keyCode == 38 || e.keyCode == 87) // up arrow or w-key
				rotationAxis = (++rotationAxis == 3) ? 0 : rotationAxis++;
			
			if(e.keyCode == 40 || e.keyCode == 83) // down arrow or s-key
				rotationAxis = (--rotationAxis < 0) ? 2 : rotationAxis--;
		}
		
		switch(rotationAxis)
		{
			case 0: document.getElementById("rotAxisText").innerHTML = "X-Axis";
					xAxisColor =  [ 1.0, 0.0, 1.0 ];
					yAxisColor =  [ 1.0, 1.0, 1.0 ];
					zAxisColor =  [ 1.0, 1.0, 1.0 ];
					break;
			case 1: document.getElementById("rotAxisText").innerHTML = "Y-Axis";
					xAxisColor =  [ 1.0, 1.0, 1.0 ];
					yAxisColor =  [ 1.0, 0.0, 1.0 ];
					zAxisColor =  [ 1.0, 1.0, 1.0 ];
					break;
			case 2:	document.getElementById("rotAxisText").innerHTML = "Z-Axis";
					xAxisColor =  [ 1.0, 1.0, 1.0 ];
					yAxisColor =  [ 1.0, 1.0, 1.0 ];
					zAxisColor =  [ 1.0, 0.0, 1.0 ];
					break;
		}
	}
	
	function MouseWheelHandler(e) 
	{//Cameraposition
		if(cubeSelected == false)
		{
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			zoom -= delta/10;
			moveCube();
		}
	}

	function MouseMoveHandler(e)
	{//Cameraposition
		if((mouseClicked_left == true || mouseClicked_right == true))
		{
			new_mouse_move_x = e.pageX-document.getElementById("DrawCubeCanvas").offsetLeft;
			new_mouse_move_y = e.pageY-document.getElementById("DrawCubeCanvas").offsetTop;
			
			if(old_mouse_move_x > new_mouse_move_x)
				move_angle_x -= 0.03;
			
			if(old_mouse_move_x < new_mouse_move_x)
				move_angle_x += 0.03;
		
			if(old_mouse_move_y > new_mouse_move_y)
				move_angle_y -= 0.03;
			
			if(old_mouse_move_y < new_mouse_move_y)
				move_angle_y += 0.03;
						
			old_mouse_move_x = new_mouse_move_x;
			old_mouse_move_y = new_mouse_move_y;
			
			moveCube();
		}
	}

	function MouseDownHandler(e) 
	{//Cubeselection (visual)
		if(e.which == 3) //trigger right mouseclick
			mouseClicked_right = true;
		
		if(e.which == 1 && rotationActive == false) //trigger left mouseclick
		{//selecting only possible when no rotation active
			mouseClicked_left = true;
			
			gl.uniform1i(uSelection, [0]); //Init.
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
			renderCube();
		
			var point_x = e.clientX;
			var point_y = e.clientY;
			var rect = e.target.getBoundingClientRect();
			
			point_x = point_x - rect.left;
			point_y = rect.bottom - point_y;
			
			gl.readPixels(point_x, point_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			gl.uniform1i(uSelection, [pixels[3]]);
			
			if(pixels[3] == 255)
				cubeSelected = false;
			else
				cubeSelected = true;
		}
	}

	function MouseUpHandler(e) 
	{	
		mouseClicked_right = false;
		mouseClicked_left = false;
	}
	
// ########################## SKYBOX ##########################

	//Setup Vertex-Shader (Create -> Source -> Compile)
	vertexShaderSky = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShaderSky, vertexShaderSkyText);
	gl.compileShader(vertexShaderSky);
		
	// Setup Fragment-Shader (Create -> Source -> Compile)
	fragmentShaderSky = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShaderSky, fragmentShaderSkyText);
	gl.compileShader(fragmentShaderSky);
	
	// Create Program, Attach Shaders, Link Program
	programSky = gl.createProgram();
	gl.attachShader(programSky, vertexShaderSky);
	gl.attachShader(programSky, fragmentShaderSky);
	gl.linkProgram(programSky);
	
	var skyboxVertices = 
	[// Each line represents a side of the skybox
		-50.0,  50.0, -50.0, -50.0, -50.0, -50.0,  50.0, -50.0, -50.0,  50.0, -50.0, -50.0,  50.0,  50.0, -50.0, -50.0,  50.0, -50.0,
		-50.0, -50.0,  50.0, -50.0, -50.0, -50.0, -50.0,  50.0, -50.0, -50.0,  50.0, -50.0, -50.0,  50.0,  50.0, -50.0, -50.0,  50.0,
		 50.0, -50.0, -50.0,  50.0, -50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0, -50.0,  50.0, -50.0, -50.0,
		-50.0, -50.0,  50.0, -50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0, -50.0,  50.0, -50.0, -50.0,  50.0,
		-50.0,  50.0, -50.0,  50.0,  50.0, -50.0,  50.0,  50.0,  50.0,  50.0,  50.0,  50.0, -50.0,  50.0,  50.0, -50.0,  50.0, -50.0,
		-50.0, -50.0, -50.0, -50.0, -50.0,  50.0,  50.0, -50.0, -50.0,  50.0, -50.0, -50.0, -50.0, -50.0,  50.0,  50.0, -50.0,  50.0
	];
	
	var skyVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBufferObject);
	var skyPositionAttribLocation = gl.getAttribLocation(programSky, 'vertPosition');	
	var matWorldUniformLocationSky = gl.getUniformLocation(programSky, 'mWorld');
	
	// Create texture
	var boxTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, boxTexture);
	
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("right"));
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("left"));
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("top"));
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("bottom"));
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("back"));
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z , 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("front"));
	
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

// ########################## SETUP ##########################

	// Setup Vertex-Shader (Create -> Source -> Compile)
	vertexShaderCube = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShaderCube, vertexShaderCubeText);
	gl.compileShader(vertexShaderCube);

	// Setup Fragment-Shader (Create -> Source -> Compile)
	fragmentShaderCube = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShaderCube, fragmentShaderCubeText);
	gl.compileShader(fragmentShaderCube);

	// Create Program, Attach Shaders, Link Program
	programCube = gl.createProgram();
	gl.attachShader(programCube, vertexShaderCube);
	gl.attachShader(programCube, fragmentShaderCube);
	gl.linkProgram(programCube);		
	gl.useProgram(programCube);

	// GPU-Upload: Vertex-Array
	var cubeVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);

	// GPU-Upload: Indices-Array
	var cubeIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);

	// Bind attributes from ARRAY_BUFFER to Vertex Shader Attribute (vertPosition), (vertColor), (sideIndex)
	var cubePositionAttribLocation = gl.getAttribLocation(programCube, 'vertPosition');
	var cubeColorAttribLocation = gl.getAttribLocation(programCube, 'vertColor');
	var cubeNormalAttribLocation = gl.getAttribLocation(programCube, 'vertNormal');
	
	var matWorldUniformLocationCube = gl.getUniformLocation(programCube, 'mWorld');
	var uNormalMatrix = gl.getUniformLocation(programCube, 'uNormalMatrix');
	var uModelMatrix = gl.getUniformLocation(programCube, 'uModelMatrix');
		
	var uDrawLines = gl.getUniformLocation(programCube, 'uDrawLines');
	var uSelection = gl.getUniformLocation(programCube, 'u_selection');
	gl.uniform1i(uSelection, [-1]); //Init.
	
	// Lighting Setup
	var uAmbientLight = gl.getUniformLocation(programCube, 'uAmbientLight');
    var uDiffuseLight = gl.getUniformLocation(programCube, 'uDiffuseLight');
    var uLightPosition = gl.getUniformLocation(programCube, 'uLightPosition');

	gl.uniform3f(uAmbientLight, 0.6, 0.6, 0.6);
	gl.uniform3f(uDiffuseLight, 1.5, 1.5, 0.7);
	gl.uniform3f(uLightPosition, 2.0, 2.0, 2.0);
	
	// Init. viewProjMatrix
	var viewMatrix = new Float32Array(16);
	mat4.lookAt(viewMatrix, [0, 0, 8], [0, 0, 0], [0, 1, 0]);
	
	var projMatrix = new Float32Array(16);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
	
	mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);	
	mat4.rotateX(viewProjMatrix, viewProjMatrix, move_angle_y);
	mat4.rotateY(viewProjMatrix, viewProjMatrix, move_angle_x);		
	
// ########################## CUBE DEFINITION ##########################

	var cubeIndex = 0;
	for(var z = 0; z < 3; z++)
		for(var y = 0; y < 3; y++)
			for(var x = 0; x < 3; x++)
				subCubes[z][y][x] = new SubCube(++cubeIndex, 
				[//  X-Coord. 	   Y-Coord.		 Z-Coord.       R-Value    G-Value	  B-Value	 #Index		 Normals
					
					// Top
					-1.0+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),	white[0],  white[1],  white[2],  cubeIndex,	  0.0, 1.0, 0.0,
					-1.0+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7),	white[0],  white[1],  white[2],  cubeIndex,	  0.0, 1.0, 0.0,
					-0.4+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7), 	white[0],  white[1],  white[2],  cubeIndex,	  0.0, 1.0, 0.0,
					-0.4+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),   white[0],  white[1],  white[2],  cubeIndex,	  0.0, 1.0, 0.0,	
					
					// Left
					-1.0+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7),   green[0],  green[1],  green[2],	 cubeIndex,  -1.0, 0.0, 0.0,
					-1.0+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),   green[0],  green[1],  green[2],	 cubeIndex,  -1.0, 0.0, 0.0,
					-1.0+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),	green[0],  green[1],  green[2],  cubeIndex,  -1.0, 0.0, 0.0,
					-1.0+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),   green[0],  green[1],  green[2],  cubeIndex,  -1.0, 0.0, 0.0,
					
					// Right
					-0.4+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7),    blue[0],   blue[1],   blue[2],  cubeIndex,   1.0, 0.0, 0.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),    blue[0],   blue[1],   blue[2],  cubeIndex,   1.0, 0.0, 0.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),    blue[0],   blue[1],   blue[2],  cubeIndex,   1.0, 0.0, 0.0,
					-0.4+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),    blue[0],   blue[1],   blue[2],  cubeIndex,   1.0, 0.0, 0.0,
					
					// Front
					-0.4+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7),     red[0],    red[1],    red[2],  cubeIndex,   0.0, 0.0, 1.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),     red[0],    red[1],    red[2],  cubeIndex,   0.0, 0.0, 1.0,
					-1.0+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),     red[0],    red[1],    red[2],  cubeIndex,   0.0, 0.0, 1.0,
					-1.0+(x*0.7), -0.4+(y*0.7), -0.4+(z*0.7),     red[0],    red[1],    red[2],  cubeIndex,   0.0, 0.0, 1.0,
					
					// Back
					-0.4+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),  orange[0], orange[1], orange[2],  cubeIndex,   0.0, 0.0, -1.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),  orange[0], orange[1], orange[2],  cubeIndex,   0.0, 0.0, -1.0,
					-1.0+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),  orange[0], orange[1], orange[2],  cubeIndex,   0.0, 0.0, -1.0,
					-1.0+(x*0.7), -0.4+(y*0.7), -1.0+(z*0.7),  orange[0], orange[1], orange[2],  cubeIndex,   0.0, 0.0, -1.0,
					
					// Bottom
					-1.0+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),  yellow[0], yellow[1], yellow[2],  cubeIndex,   0.0, -1.0, 0.0,
					-1.0+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),  yellow[0], yellow[1], yellow[2],  cubeIndex,   0.0, -1.0, 0.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -0.4+(z*0.7),  yellow[0], yellow[1], yellow[2],  cubeIndex,   0.0, -1.0, 0.0,
					-0.4+(x*0.7), -1.0+(y*0.7), -1.0+(z*0.7),  yellow[0], yellow[1], yellow[2],  cubeIndex,   0.0, -1.0, 0.0
				],
				[
					// Top						// Left						// Right
					0, 1, 2, 0, 2, 3,			5, 4, 6, 6, 4, 7,			8, 9, 10, 8, 10, 11,		
					// Front					// Back						// Bottom
					13, 12, 14, 15, 14, 12,		16, 17, 18, 16, 18, 19,		21, 20, 22, 22, 20, 23	
				]);

// ########################## SKYBOX ##########################

	function renderSky()
	{	
		gl.useProgram(programSky);
		gl.vertexAttribPointer(skyPositionAttribLocation, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.uniformMatrix4fv(matWorldUniformLocationSky, gl.FALSE, viewProjMatrix);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), gl.STATIC_DRAW);
		gl.drawArrays(gl.TRIANGLES, 0, 36);
	}
				
// ########################## LINE SETUP ##########################

	function renderLines()
	{	
		gl.useProgram(programCube);
		
		gl.uniform1i(uDrawLines, [1]); // enable draw lines
	
		gl.vertexAttribPointer(cubePositionAttribLocation, 3, gl.FLOAT, gl.FALSE, 10 * Float32Array.BYTES_PER_ELEMENT, 0*  Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(cubePositionAttribLocation);
		gl.vertexAttribPointer(cubeColorAttribLocation, 4, gl.FLOAT, gl.FALSE, 10 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(cubeColorAttribLocation);
		gl.vertexAttribPointer(cubeNormalAttribLocation, 3, gl.FLOAT, gl.TRUE, 10 * Float32Array.BYTES_PER_ELEMENT, 7 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(cubeNormalAttribLocation);
		
		var lineBuffer = 
		[
			-5.0,  0.0,  0.0,   xAxisColor[0], xAxisColor[1], xAxisColor[2],  0,  0,0,0,		
			 5.0,  0.0,  0.0,   xAxisColor[0], xAxisColor[1], xAxisColor[2],  0,  0,0,0,	
			 0.0, -5.0,  0.0,   yAxisColor[0], yAxisColor[1], yAxisColor[2],  0,  0,0,0,		
			 0.0,  5.0,  0.0,   yAxisColor[0], yAxisColor[1], yAxisColor[2],  0,  0,0,0,
			 0.0,  0.0, -5.0,   zAxisColor[0], zAxisColor[1], zAxisColor[2],  0,  0,0,0,		
			 0.0,  0.0,  5.0,   zAxisColor[0], zAxisColor[1], zAxisColor[2],  0,  0,0,0		 
		];
		
		gl.uniformMatrix4fv(matWorldUniformLocationCube, gl.FALSE, viewProjMatrix);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineBuffer), gl.STATIC_DRAW);
		gl.drawArrays(gl.LINES, 0, 6);
		
		gl.uniform1i(uDrawLines, [0]); // disable draw lines
	}
	
// ########################## ZOOM & MOVING ##########################
	
	function moveCube()
	{
		mat4.lookAt(viewMatrix, [0, 0, 8*zoom], [0, 0, 0], [0, 1, 0]);
		mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
		mat4.rotateX(viewProjMatrix, viewProjMatrix, move_angle_y);
		mat4.rotateY(viewProjMatrix, viewProjMatrix, move_angle_x);	
	}
	
// ########################## RENDERING ##########################
	
	function renderCube()
	{	
		var uMatrix = mat4.create();
		for(var z = 0; z < 3; z++)
			for(var y = 0; y < 3; y++)
				for(var x = 0; x < 3; x++)
				{
					gl.uniformMatrix4fv(uModelMatrix, false, subCubes[z][y][x].rotatedMatrix);
					gl.uniformMatrix3fv(uNormalMatrix, false, mat3.normalFromMat4(mat3.create(), subCubes[z][y][x].rotatedMatrix));
					mat4.multiply(uMatrix, viewProjMatrix, subCubes[z][y][x].rotatedMatrix);
					gl.uniformMatrix4fv(matWorldUniformLocationCube, gl.FALSE, uMatrix);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(subCubes[z][y][x].vertexBuffer), gl.STATIC_DRAW);
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(subCubes[z][y][x].indexBuffer), gl.STATIC_DRAW);
					gl.drawElements(gl.TRIANGLES, subCubes[z][y][x].indexBuffer.length, gl.UNSIGNED_SHORT, 0);
				}
	}
	
// ########################## ANIMATION ##########################
	
	var animateCube = function () 
	{
		if(rotationActive == true)
			rotateSide(rotationAxis, rotationDirection);
		
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);	
		
		renderSky();
		renderLines();
		renderCube();
		
		requestAnimationFrame(animateCube);
	};
	requestAnimationFrame(animateCube);
	
// ########################## HELP-FUNC ##########################
	
	function getPositionByIndex(selectedCubeIndex)
	{//Mit CubeIndex herausfinden, welche tatsächliche Position gedreht werden muss
		for(var z = 0; z < 3; z++)
			for(var y = 0; y < 3; y++)
				for(var x = 0; x < 3; x++)
					if(subCubes[z][y][x].subCubeIndex == selectedCubeIndex)
						return subCubes[z][y][x].subCubePosID;
	}
	
// ########################## ROTATION ##########################
	
	function rotateSide(_rotationAxis, _rotationDirection)
	{	
		if(cubeSelected == true)
		{
			var subCubeHelp = new SubCube(1, [0], [0]);
			var subCubePosID = getPositionByIndex(pixels[3]);
			
			if(rotationAxis == 0)
			{//Rotation around X-Axis
				if(subCubePosID == 27 || subCubePosID == 18 || subCubePosID == 9
				|| subCubePosID == 24 || subCubePosID == 15 || subCubePosID == 6
				|| subCubePosID == 21 || subCubePosID == 12 || subCubePosID == 3)
					var xIndex = 2;
					
				if(subCubePosID == 26 || subCubePosID == 17 || subCubePosID == 8
				|| subCubePosID == 23 || subCubePosID == 14 || subCubePosID == 5
				|| subCubePosID == 20 || subCubePosID == 11 || subCubePosID == 2)
					var xIndex = 1;
					
				if(subCubePosID == 25 || subCubePosID == 16 || subCubePosID == 7
				|| subCubePosID == 22 || subCubePosID == 13 || subCubePosID == 4
				|| subCubePosID == 19 || subCubePosID == 10 || subCubePosID == 1)
					var xIndex = 0
					
				for(var z = 0; z < 3; z++)
					for(var y = 0; y < 3; y++)
						subCubes[z][y][xIndex].transformSubCube(_rotationAxis, _rotationDirection);
											
				if(rotationActive == false)
				{//Update Cube: Change Position of 9 Cubes in the Cube-Array
					if(_rotationDirection == -1)
					{
						subCubeHelp.copyValues(subCubes[1][2][xIndex]);
						subCubes[1][2][xIndex].copyValues(subCubes[2][1][xIndex]);
						subCubes[2][1][xIndex].copyValues(subCubes[1][0][xIndex]);
						subCubes[1][0][xIndex].copyValues(subCubes[0][1][xIndex]);
						subCubes[0][1][xIndex].copyValues(subCubeHelp);			
								
						subCubeHelp.copyValues(subCubes[0][2][xIndex]);
						subCubes[0][2][xIndex].copyValues(subCubes[2][2][xIndex]);
						subCubes[2][2][xIndex].copyValues(subCubes[2][0][xIndex]);
						subCubes[2][0][xIndex].copyValues(subCubes[0][0][xIndex]);
						subCubes[0][0][xIndex].copyValues(subCubeHelp);							
					}
											
					if(_rotationDirection == 1)
					{
						subCubeHelp.copyValues(subCubes[1][2][xIndex]);
						subCubes[1][2][xIndex].copyValues(subCubes[0][1][xIndex]);
						subCubes[0][1][xIndex].copyValues(subCubes[1][0][xIndex]);
						subCubes[1][0][xIndex].copyValues(subCubes[2][1][xIndex]);
						subCubes[2][1][xIndex].copyValues(subCubeHelp);
							
						subCubeHelp.copyValues(subCubes[0][2][xIndex]);
						subCubes[0][2][xIndex].copyValues(subCubes[0][0][xIndex]);
						subCubes[0][0][xIndex].copyValues(subCubes[2][0][xIndex]);
						subCubes[2][0][xIndex].copyValues(subCubes[2][2][xIndex]);
						subCubes[2][2][xIndex].copyValues(subCubeHelp);
					}
				}
			}				
			
			if(_rotationAxis == 1)
			{//Rotation around Y-Axis
				if(subCubePosID == 7 || subCubePosID == 8 || subCubePosID == 9
				|| subCubePosID == 16 || subCubePosID == 17 || subCubePosID == 18
				|| subCubePosID == 25 || subCubePosID == 26 || subCubePosID == 27)
					var yIndex = 2;
					
				if(subCubePosID == 4 || subCubePosID == 5 || subCubePosID == 6
				|| subCubePosID == 13 || subCubePosID == 14 || subCubePosID == 15
				|| subCubePosID == 22 || subCubePosID == 23 || subCubePosID == 24)
					var yIndex = 1;
					
				if(subCubePosID == 1 || subCubePosID == 2 || subCubePosID == 3
				|| subCubePosID == 10 || subCubePosID == 11 || subCubePosID == 12
				|| subCubePosID == 19 || subCubePosID == 20 || subCubePosID == 21)
					var yIndex = 0;
					
				for(var z = 0; z < 3; z++)
					for(var x = 0; x < 3; x++)
						subCubes[z][yIndex][x].transformSubCube(_rotationAxis, _rotationDirection);

				if(rotationActive == false)
				{
					if(_rotationDirection == -1)
					{
						subCubeHelp.copyValues(subCubes[0][yIndex][2]);
						subCubes[0][yIndex][2].copyValues(subCubes[0][yIndex][0]);
						subCubes[0][yIndex][0].copyValues(subCubes[2][yIndex][0]);
						subCubes[2][yIndex][0].copyValues(subCubes[2][yIndex][2]);
						subCubes[2][yIndex][2].copyValues(subCubeHelp);
						
						subCubeHelp.copyValues(subCubes[0][yIndex][1]);
						subCubes[0][yIndex][1].copyValues(subCubes[1][yIndex][0]);
						subCubes[1][yIndex][0].copyValues(subCubes[2][yIndex][1]);
						subCubes[2][yIndex][1].copyValues(subCubes[1][yIndex][2]);
						subCubes[1][yIndex][2].copyValues(subCubeHelp);
					}
					
					if(_rotationDirection == 1)
					{
						subCubeHelp.copyValues(subCubes[0][yIndex][2]);
						subCubes[0][yIndex][2].copyValues(subCubes[2][yIndex][2]);
						subCubes[2][yIndex][2].copyValues(subCubes[2][yIndex][0]);
						subCubes[2][yIndex][0].copyValues(subCubes[0][yIndex][0]);
						subCubes[0][yIndex][0].copyValues(subCubeHelp);
						
						subCubeHelp.copyValues(subCubes[0][yIndex][1]);
						subCubes[0][yIndex][1].copyValues(subCubes[1][yIndex][2]);
						subCubes[1][yIndex][2].copyValues(subCubes[2][yIndex][1]);
						subCubes[2][yIndex][1].copyValues(subCubes[1][yIndex][0]);
						subCubes[1][yIndex][0].copyValues(subCubeHelp);
					}
				}
			}
			
			if(_rotationAxis == 2)
			{//Rotation around Z-Axis
				if(subCubePosID == 27 || subCubePosID == 26 || subCubePosID == 25
				|| subCubePosID == 24 || subCubePosID == 23 || subCubePosID == 22
				|| subCubePosID == 21 || subCubePosID == 20 || subCubePosID == 19)
					var zIndex = 2;
					
				if(subCubePosID == 18 || subCubePosID == 17 || subCubePosID == 16
				|| subCubePosID == 15 || subCubePosID == 14 || subCubePosID == 13
				|| subCubePosID == 12 || subCubePosID == 11 || subCubePosID == 10)
					var zIndex = 1;
					
				if(subCubePosID == 9 || subCubePosID == 8 || subCubePosID == 7
				|| subCubePosID == 6 || subCubePosID == 5 || subCubePosID == 4
				|| subCubePosID == 3 || subCubePosID == 2 || subCubePosID == 1)
					var zIndex = 0;
					
				for(var y = 0; y < 3; y++)
					for(var x = 0; x < 3; x++)
						subCubes[zIndex][y][x].transformSubCube(_rotationAxis, _rotationDirection);

				if(rotationActive == false)
				{
					if(_rotationDirection == -1)
					{
						subCubeHelp.copyValues(subCubes[zIndex][2][1]);
						subCubes[zIndex][2][1].copyValues(subCubes[zIndex][1][0]);
						subCubes[zIndex][1][0].copyValues(subCubes[zIndex][0][1]);
						subCubes[zIndex][0][1].copyValues(subCubes[zIndex][1][2]);
						subCubes[zIndex][1][2].copyValues(subCubeHelp);
						
						subCubeHelp.copyValues(subCubes[zIndex][2][2]);
						subCubes[zIndex][2][2].copyValues(subCubes[zIndex][2][0]);
						subCubes[zIndex][2][0].copyValues(subCubes[zIndex][0][0]);
						subCubes[zIndex][0][0].copyValues(subCubes[zIndex][0][2]);
						subCubes[zIndex][0][2].copyValues(subCubeHelp);
					}
					
					if(_rotationDirection == 1)
					{
						subCubeHelp.copyValues(subCubes[zIndex][2][1]);
						subCubes[zIndex][2][1].copyValues(subCubes[zIndex][1][2]);
						subCubes[zIndex][1][2].copyValues(subCubes[zIndex][0][1]);
						subCubes[zIndex][0][1].copyValues(subCubes[zIndex][1][0]);
						subCubes[zIndex][1][0].copyValues(subCubeHelp);
						
						subCubeHelp.copyValues(subCubes[zIndex][2][2]);
						subCubes[zIndex][2][2].copyValues(subCubes[zIndex][0][2]);
						subCubes[zIndex][0][2].copyValues(subCubes[zIndex][0][0]);
						subCubes[zIndex][0][0].copyValues(subCubes[zIndex][2][0]);
						subCubes[zIndex][2][0].copyValues(subCubeHelp);
					}
				}
			}
		}
	}
};