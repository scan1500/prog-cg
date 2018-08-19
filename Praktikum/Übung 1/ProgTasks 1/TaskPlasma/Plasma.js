function initAnimation()
{
	 canvas = document.getElementById("Task01aCanvas");
	 context = canvas.getContext("2d");
	 canvasImage = context.createImageData(canvas.width, canvas.height);
	 t = 0;
}

function showFrameBuffer()
{
	context.putImageData(canvasImage, 0, 0);
}

function drawPlasma(e)
{
	var xMouse = e.pageX-document.getElementById("CanvasContainer").offsetLeft;
	var yMouse = e.pageY-document.getElementById("CanvasContainer").offsetTop;

	document.getElementById("x").innerHTML = xMouse;
	document.getElementById("y").innerHTML = yMouse;
	
	var imgData = canvasImage.data;

	for (var y = 0; y < canvas.height; y++)
	{
		for (var x = 0; x < canvas.width; x++) 
		{
			addr = 4 * (y * canvas.width + x);
			var color = (128.0 + (128.0*Math.sin(x/(8+t)))) + (128.0 + (128.0*Math.sin(y/(8+t))));
			
			imgData[addr + 0] = color/2;
			imgData[addr + 1] = color/(xMouse/75);
			imgData[addr + 2] = color/(yMouse/75);
			imgData[addr + 3] = 255;	
		}
	}
	showFrameBuffer();
	t+=0.05;
	//window.requestAnimationFrame(drawPlasma);
	

}