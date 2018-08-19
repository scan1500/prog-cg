// Vertex-Shader
var vertexShaderText = 
`#version 300 es

in vec4 vertPosition;
out vec2 outPosition;

void main() 
{
	gl_Position = vertPosition;
	outPosition = vec2(vertPosition);
}
`;

// Fragment-Shader
var fragmentShaderText = 
`#version 300 es

precision mediump float;
in vec2 outPosition;
out vec4 fragColor;	
uniform float u_timer;	
float PI = 3.1415926535897932384626433832795;

void main()
{
	fragColor = vec4(
		abs(sin(1.3 * (float(outPosition.x) + 1.0)/2.0 * PI + 0.3 * u_timer) * cos(2.3 * (float(outPosition.y) + 1.0)/2.0 * PI + 0.3 * u_timer)),
		abs(sin(1.9 * (float(outPosition.x) + 1.0)/2.0 * PI - 0.7 * u_timer) * cos(1.4 * (float(outPosition.y) + 1.0)/2.0 * PI - 0.6 * u_timer)),
		abs(sin(1.5 * (float(outPosition.x) + 1.0)/2.0 * PI + 1.5 * u_timer) * cos(2.7 * (float(outPosition.y) + 1.0)/2.0 * PI + 1.3 * u_timer)),
		1.0);
}
`;

function drawPlasma()
{
	// Init. WebGL Context
	var canvas = document.getElementById("DrawPlasmaCanvas");
	var gl = canvas.getContext("webgl2");
	
	// Set Canvas Color
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Setup Vertex-Shader (Create -> Source -> Compile)
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) 
	{
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}
	
	// Setup Fragment-Shader (Create -> Source -> Compile)
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderText);
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) 
	{
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	// Create Program, Attach Shaders, Link Program
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	
	// Triangle Definition
	var v = [-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]; 	
	
	// GPU-Upload: Vertex-Array
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
	
	// Bind attributes from ARRAY_BUFFER to Vertex Shader Attribute (Coordinates)
	var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
	gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.enableVertexAttribArray(positionAttribLocation);
	
	// Render Triangles
	gl.useProgram(program);
	
	var uTimer = gl.getUniformLocation(program, "u_timer");
	var timer = 0.0;

	var loop = function() 
	{
		gl.uniform1fv(uTimer, [timer += 0.008]);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};