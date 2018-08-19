"use strict";

function max(a, b)
{
	return a > b ? a : b;
}

function Circle(canvas_)
{
	var mCanvas = canvas_;
	var gl = null;
	var mProgram = null;
	var mUScreenSize = null;
	var mUBorderWidth = 0;
	var mVAO = null;

	function initGL()
	{
		try
		{
			gl = mCanvas.getContext("webgl2");
		}
		catch (e)
		{}
		if (!gl)
		{
			alert("Could not initialize WebGL");
		}
	}

	function resize()
	{
		var ratio = window.devicePixelRatio ? window.devicePixelRatio : 1;
		var w = mCanvas.clientWidth * ratio;
		var h = mCanvas.clientHeight* ratio;

		if (mCanvas.width != w || mCanvas.height != h)
		{
			mCanvas.width = w;
			mCanvas.height = h;
			gl.viewport(0, 0, w, h);
		}
	}

	var vertexShaderSource = `#version 300 es
	in vec4 a_position;
	out vec2 v_localCoordinates;
	uniform vec2 screenSize;
	void main() 
	{
	    gl_Position = a_position;
		v_localCoordinates = a_position.xy;
		if(screenSize.x > screenSize.y)
		{
			v_localCoordinates.x *= screenSize.x / screenSize.y;
		} else
		{
			v_localCoordinates.y *= screenSize.y / screenSize.x;
		}
		
	}
	`;

	var fragmentShaderSource = `#version 300 es
	precision mediump float;
	out vec4 outColor;
	in vec2 v_localCoordinates;
	
	uniform float borderWidth;

	void main() 
	{
		float distanceToBorder = length(v_localCoordinates);

		if (distanceToBorder <= 1.0)
		{
			if(distanceToBorder > (1.0 - borderWidth))
			{
				outColor = vec4(0,0,0,1);
			} else
			{
				outColor = vec4(1,0,0,1);
			}
		} else
		{
			outColor = vec4(1,1,1,1);
		}
	}
	`;

	function createShader(type, source)
	{
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success)
		{
			return shader;
		}

		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return undefined;
	}

	function createProgram(vertexShader, fragmentShader)
	{
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (success)
		{
			return program;
		}

		console.log(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return undefined;
	}

	function createProgramFromSource(vertexShaderSourceCode, fragmentShaderSourceCode)
	{
		var vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSourceCode);
		var fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSourceCode);
		var program = createProgram(vertexShader, fragmentShader);
		return program;
	}

	function initScene()
	{
		// Create Shader
		mProgram = createProgramFromSource(vertexShaderSource, fragmentShaderSource);
		
		// Get attribute locations
		var positionAttributeLocation = gl.getAttribLocation(mProgram, "a_position");
		
		// Get uniform locations
		mUScreenSize = gl.getUniformLocation(mProgram, "screenSize");
		mUBorderWidth = gl.getUniformLocation(mProgram, "borderWidth");
		
		// Create vertex buffer to store positions
		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		var positions = [
			-1.0, -1.0,
			-1.0, +1.0,
			+1.0, +1.0,
			+1.0, +1.0,
			+1.0, -1.0,
			-1.0, -1.0		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		// Create Vertex Array
		mVAO = gl.createVertexArray();
		gl.bindVertexArray(mVAO);
		gl.enableVertexAttribArray(positionAttributeLocation);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
		
		requestAnimationFrame(drawScene);
	}

	function drawScene(timer)
	{
		resize();
		// Clear
		gl.clearColor(1.0, 1.0, 1.0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		// Bind Shader
		gl.useProgram(mProgram);
		
		// Set shader unforms.
		gl.uniform2fv(mUScreenSize, [mCanvas.width, mCanvas.height]);
		var pixelWidth = 2.0 / (mCanvas.width);
		var pixelHeight = 2.0 / (mCanvas.height);
		var scaleFactor = max(pixelHeight, pixelWidth);
		gl.uniform1fv(mUBorderWidth, [scaleFactor * document.getElementById("borderSizeSlider").value]);
		
		// Bind Vertex Array
		gl.bindVertexArray(mVAO);
		
		// Issue draw call
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		
		requestAnimationFrame(drawScene);
	}
	
	initGL();
	initScene();
}



function start(canvas_)
{
	var t = new Circle(canvas_);
}

function setupUI()
{	
	var slider = document.getElementById("borderSizeSlider");
	var output = document.getElementById("borderSizeSpan");
	output.innerHTML = slider.value;

	slider.oninput = function() {
	  output.innerHTML = this.value;
	}
}