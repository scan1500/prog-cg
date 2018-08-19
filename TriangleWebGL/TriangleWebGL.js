// Vertex-Shader
var vertexShaderText = 
[
	'precision mediump float;',
	'',
	'attribute vec2 vertPosition;',
	'attribute vec3 vertColor;',
	'varying vec3 fragColor;',
	'void main()', 
	'{',
	'	fragColor = vertColor;',
	'	gl_Position = vec4(vertPosition, 0.0, 1.0);',
	'}'
].join('\n');

// Fragment-Shader
var fragmentShaderText = 
[
	'precision mediump float;',
	'',
	'varying vec3 fragColor;',
	'void main()', 
	'{',
	'	gl_FragColor = vec4(fragColor, 1.0);',
	'}'
].join('\n');

function drawTriangle()
{
	// Init. WebGL Context
	var canvas = document.getElementById("DrawTriangleCanvas");
	var gl = canvas.getContext("webgl2");
	
	// Set Canvas Color
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Setup Vertex-Shader (Create -> Source -> Compile)
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.compileShader(vertexShader);
	
	// Setup Fragment-Shader (Create -> Source -> Compile)
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderText);
	gl.compileShader(fragmentShader);

	// Create Program, Attach Shaders, Link Program
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	
	// Triangle Definition
	var v = 
	[//  X 	 Y 		R,G,B
		-1, -1, 	1,0,0,
		-1,  1, 	0,1,0,
		 1,  1, 	0,0,1,
		 
		 1,  1, 	1,0,0,
		 1, -1, 	0,1,0,
		-1, -1, 	0,0,1
	]; 	
	
	// GPU-Upload: Vertex-Array
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
	
	// Bind attributes from ARRAY_BUFFER to Vertex Shader Attribute (Coordinates)
	var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
	gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(positionAttribLocation);

	// Bind attributes from ARRAY_BUFFER to Vertex Shader Attribute (Colors)
	var colorAttribLocation = gl.getAttribLocation(program, "vertColor");
	gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
	gl.enableVertexAttribArray(colorAttribLocation);
	
	// Render Triangles
	gl.useProgram(program);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
};