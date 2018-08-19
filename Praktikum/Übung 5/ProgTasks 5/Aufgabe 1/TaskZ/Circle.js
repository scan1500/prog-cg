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
	var uniformLocation = null;
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

	var vertexShaderSource = 
	`#version 300 es
	
	precision mediump float;
	
	in vec4 a_position;
	in vec3 vertColor;
	
	out vec2 v_localCoordinates;
	out vec3 outColor;
	
	uniform vec2 u_scale;
	uniform vec2 u_size;
	
	void main() 
	{
	    gl_Position = a_position;
		v_localCoordinates = vec2(a_position) * u_scale * u_size;
		outColor = vertColor;
	}
	`;

	var fragmentShaderSource = 
	`#version 300 es
	
	precision mediump float;
	
	in vec3 outColor;
	in vec2 v_localCoordinates;
	
	out vec4 fragColor;
	
	uniform float u_borderSize;
	
	void main() 
	{
		if(length(v_localCoordinates) < 1.0)
		{
			if(length(v_localCoordinates) < 1.0	- u_borderSize)		
				fragColor = vec4(1.0, 0.0, 0.0, 1.0);
			else
				fragColor = vec4(0.0, 0.0, 0.0, 1.0);
		}
		else
		{
			fragColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
	}
	`;	
	
	function initScene()
	{	
		// Create Shader
		mProgram = createProgramFromSource(vertexShaderSource, fragmentShaderSource);
		
		// Get attribute locations
		var positionAttributeLocation = gl.getAttribLocation(mProgram, "a_position");
		
		// Create vertex buffer to store positions
		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		var positions = 
		[
			-1.0, -1.0, 0, 0, 1, // 0
			-1.0, +1.0, 0, 1, 0, // 1
			+1.0, -1.0,	1, 1, 0, // 2
			+1.0, +1.0, 1, 0, 0  // 3
		];
		
		var indices = [2, 0, 1, 1, 3, 2];
		
		
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		// Create Vertex Array
		mVAO = gl.createVertexArray();
		gl.bindVertexArray(mVAO);
		gl.enableVertexAttribArray(positionAttributeLocation);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		
		var ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		
		// Bind attributes from ARRAY_BUFFER to Vertex Shader Attribute (Colors)
		var colorAttribLocation = gl.getAttribLocation(mProgram, "vertColor");
		gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(colorAttribLocation);
		
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
		
		var uScale = gl.getUniformLocation(mProgram, "u_scale");
		var uBorder = gl.getUniformLocation(mProgram, "u_borderSize");
		var borderSliderSize = document.getElementById("borderSizeSlider").value;
		
		if(mCanvas.width > mCanvas.height)
		{
			gl.uniform2fv(uScale, [(mCanvas.width/mCanvas.height), 1.0]);
			gl.uniform1fv(uBorder, [2 * borderSliderSize / (mCanvas.height)]);
		}
		else
		{
			gl.uniform2fv(uScale, [1.0, mCanvas.heigt/mCanvas.width]);
			gl.uniform1fv(uBorder, [2 * borderSliderSize / (mCanvas.width)]);
		}
		
		var uSize = gl.getUniformLocation(mProgram, "u_size");
		var circleSliderSize = document.getElementById("circleSizeSlider").value;
		gl.uniform2fv(uSize, [circleSliderSize, circleSliderSize]);



		
		// Bind Vertex Array
		gl.bindVertexArray(mVAO);
		
		// Issue draw call
		//gl.drawArrays(gl.TRIANGLES, 0, 6);
		
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		
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
	var circleSlider = document.getElementById("circleSizeSlider");
	var circleOutput = document.getElementById("circleSizeSpan");
	circleOutput.innerHTML = circleSlider.value;

	circleSlider.oninput = function() 
	{
		circleOutput.innerHTML = this.value;
	}
	
	var borderSlider = document.getElementById("borderSizeSlider");
	var borderOutput = document.getElementById("borderSizeSpan");
	borderOutput.innerHTML = borderSlider.value;

	borderSlider.oninput = function() 
	{
		borderOutput.innerHTML = this.value;
	}
}