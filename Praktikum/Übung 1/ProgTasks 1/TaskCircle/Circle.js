function drawCircle()
{
	var canvas = document.getElementById("DrawCircleCanvas");
	var context = canvas.getContext("2d");
	var canvasImage = context.createImageData(canvas.width, canvas.height);
	var imgData = canvasImage.data;
	
	// Edit below this line.
	for (var y = 0; y < canvas.height; y++)
	{
		for (var x = 0; x < canvas.width; x++) 
		{
			addr = 4 * (y * canvas.width + x);
			var distance = Math.sqrt((x - 128) * (x - 128) + (y - 128) * (y - 128));
			if(distance <= 96)
			{
				imgData[addr + 0] = 128;
				imgData[addr + 1] = 128;
				imgData[addr + 2] = 128;
				imgData[addr + 3] = 255;			
			}
		}
	}
	// Edit above this line.
	context.putImageData(canvasImage, 0, 0);
}

function drawCircleBoundary()
{
	var canvas = document.getElementById("DrawCircleBoundaryCanvas");
	var context = canvas.getContext("2d");
	var canvasImage = context.createImageData(canvas.width, canvas.height);
	var fb = canvasImage.data;
	
	// Edit below this line.
	var resultIntensity = 0;
	for (var y = 0; y < canvas.height; y++)
		for (var x = 0; x < canvas.width; x++) 
		{
			addr = 4 * (y * canvas.width + x);
			var distance = Math.sqrt((x - 128) * (x - 128) + (y - 128) * (y - 128));
			
			if(distance < 96)
			{
				if(distance < 86)
					resultIntensity = 128;
				else
					resultIntensity = 0;
				fb[addr + 0] = resultIntensity;
				fb[addr + 1] = resultIntensity;
				fb[addr + 2] = resultIntensity;
				fb[addr + 3] = 255;			
			}

		}
	// Edit above this line.
	context.putImageData(canvasImage, 0, 0);
}

function drawCircleCanvasContext()
{
	var canvas = document.getElementById("drawCircleCanvasContext");
	var context = canvas.getContext("2d");	
	
	// Edit below this line.
	context.fillStyle = "rgb(128,128,128)";
	context.lineWidth = 10;
	context.strokeStyle = "rgb(0,0,0)";
	context.beginPath();
	context.arc(128, 128, 96, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
	// Edit above this line.
}


