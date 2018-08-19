"use strict";

function CircleApproximation(canvas_)
{
	var mCanvas = canvas_;
	var gl = null;
	var mProgram = null;
	var mVAO = null;
	var mNTriangles = 3;
	var positionBuffer = null;
	var PI = 3.1415926535897932384626433832795;
	var radius = 500;
	var x = mCanvas.width/2;
	var y = mCanvas.height/2;
	
	function fillBuffer()
	{
		mNTriangles = document.getElementById("segmentsSlider").value;
		
		var numberOfVertices = mNTriangles + 2;
    
		var twicePi = 2.0 * PI;
		
		var circleVerticesX = new Array(numberOfVertices);
		var circleVerticesY = new Array(numberOfVertices);
		
		circleVerticesX[0] = (x + 1.0)/2.0;
		circleVerticesY[0] = (y + 1.0)/2.0;
		
		for ( var i = 1; i < numberOfVertices; i++ )
		{
			circleVerticesX[i] = ((x + (radius * Math.cos(i * twicePi / mNTriangles))) + 1.0)/2.0;
			circleVerticesY[i] = ((y + (radius * Math.sin(i * twicePi / mNTriangles))) + 1.0)/2.0;
		}
		
		var allCircleVertices = new Array(numberOfVertices * 2);
		
		for ( var i = 0; i < numberOfVertices; i++ )
		{
			allCircleVertices[( i * 2 ) + 0] = circleVerticesX[i]*(2.0/mCanvas.width);
			allCircleVertices[( i * 2 ) + 1] = circleVerticesY[i]*(2.0/mCanvas.height);
		}
		
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allCircleVertices), gl.STATIC_DRAW);
	}
	
	function setupUI()
	{		
		var slider = document.getElementById("segmentsSlider");
		var output = document.getElementById("segmentsSpan");
		output.innerHTML = slider.value;

		slider.oninput = function() 
		{
			output.innerHTML = this.value;
			fillBuffer();
		}
	}

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
	void main() 
	{
	    gl_Position = a_position;
	}
	`;

	var fragmentShaderSource = `#version 300 es
	precision mediump float;
	out vec4 fragColor;
	
	void main() 
	{
		fragColor = vec4(1,0,0,1);
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
		
		// Create vertex buffer to store positions
		positionBuffer = gl.createBuffer();
		
		// Create Vertex Array
		mVAO = gl.createVertexArray();
		gl.bindVertexArray(mVAO);

		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.enableVertexAttribArray(positionAttributeLocation);
		
		resize();
		fillBuffer();
		gl.useProgram(mProgram);
		requestAnimationFrame(drawScene);
	}

	function drawScene(timer)
	{
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, mNTriangles+2);
		requestAnimationFrame(drawScene);
	}
	
	setupUI();
	initGL();
	initScene();
}

function start(canvas_)
{
	var circleApproximation = new CircleApproximation(canvas_);
}

