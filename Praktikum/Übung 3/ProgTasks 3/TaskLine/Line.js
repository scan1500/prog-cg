function setPixel(x, y, canvasImage)
{
	var fb = canvasImage.data;
	var offset = 4 * (y * canvasImage.width + x);
	fb[offset + 0] = 0;
	fb[offset + 1] = 0;
	fb[offset + 2] = 0;
	fb[offset + 3] = 255;
}

function setPixelIntensity(x, y, intensity, canvasImage)
{
	var fb = canvasImage.data;
	var offset = 4 * (y * canvasImage.width + x);
	fb[offset + 0] = 255 * intensity;
	fb[offset + 1] = 255 * intensity;
	fb[offset + 2] = 255 * intensity;
	fb[offset + 3] = 255;
}

function drawLineStub(xa, ya, xb, yb, canvasImage)
{
	var m = (yb - ya)/(xb - xa);
	if(Math.abs(m) < 1)
	{
		if(xb > xa)
		{
			for(var x = xa; x <= xb; x++)
			{//drawing right lines with m=]-1;1[
				y = m * (x-xa) + ya;
				if(y % 1 != 0)
				{
					setPixelIntensity(x, Math.floor(y), 1-(Math.ceil(y)-y), canvasImage);
					setPixelIntensity(x, Math.ceil(y), 1-(y-Math.floor(y)), canvasImage);
				}
				else //Kein Schnittpunkt mit Pixel darüber/darunter
				{
					setPixel(x, y, canvasImage);
				}
			}
		}
		else
		{
			for(var x = xa; x >= xb; x--)
			{//drawing left lines with (-1*)m=]-1;1[
				y = -1 * m * Math.abs(x-xa) + ya;
				if(y % 1 != 0)
				{
					setPixelIntensity(x, Math.floor(y), 1-(Math.ceil(y)-y), canvasImage);
					setPixelIntensity(x, Math.ceil(y), 1-(y-Math.floor(y)), canvasImage);
				}
				else //Kein Schnittpunkt mit Pixel darüber/darunter
				{
					setPixel(x, y, canvasImage);
				}
			}
		}
	}
	else
	{
		if(xb >= xa)
		{
			if(m >= 1)
			{
				for(var y = ya; y <= yb; y++)
				{//drawing right lines with m > 1
					x = (1/m) * (y-ya) + xa;
					if(x % 1 != 0)
					{
						setPixelIntensity(Math.floor(x), y, 1-(Math.ceil(x)-x), canvasImage);
						setPixelIntensity(Math.ceil(x), y, 1-(x-Math.floor(x)), canvasImage);
					}
					else //Kein Schnittpunkt mit Pixel darüber/darunter
					{
						setPixel(x, y, canvasImage);
					}
				}
			}
			else
			{
				for(var y = ya; y >= yb; y--)
				{//drawing right lines with m < 1
					x = (1/(-1*m)) * Math.abs(y-ya) + xa;
					if(x % 1 != 0)
					{
						setPixelIntensity(Math.floor(x), y, 1-(Math.ceil(x)-x), canvasImage);
						setPixelIntensity(Math.ceil(x), y, 1-(x-Math.floor(x)), canvasImage);
					}
					else //Kein Schnittpunkt mit Pixel darüber/darunter
					{
						setPixel(x, y, canvasImage);
					}
				}
			}
		}
		else
		{
			if(m >= 1)
			{
				for(var y = ya; y >= yb; y--)
				{//drawing left lines with m >= 1
					x = (1/m) * (y-ya) + xa;
					if(x % 1 != 0)
					{
						setPixelIntensity(Math.floor(x), y, 1-(Math.ceil(x)-x), canvasImage);
						setPixelIntensity(Math.ceil(x), y, 1-(x-Math.floor(x)), canvasImage);
					}
					else //Kein Schnittpunkt mit Pixel darüber/darunter
					{
						setPixel(x, y, canvasImage);
					}
				}
			}
			else
			{
				for(var y = ya; y <= yb; y++)
				{//drawing left lines with m =< -1
					x = (1/m) * (y-ya) + xa;
					if(x % 1 != 0)
					{
						setPixelIntensity(Math.floor(x), y, 1-(Math.ceil(x)-x), canvasImage);
						setPixelIntensity(Math.ceil(x), y, 1-(x-Math.floor(x)), canvasImage);
					}
					else //Kein Schnittpunkt mit Pixel darüber/darunter
					{
						setPixel(x, y, canvasImage);
					}
				}
			}
		}
	}
}

function drawLineTest()
{
	var canvas = document.getElementById("DrawLineCanvas");
	var context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
	var canvasImage = context.createImageData(canvas.width, canvas.height);
	
	var r0 = 32;
	var r1 = 255;
	var nLines = 64;
	var x0 = Math.round(canvas.width * 0.5);
	var y0 = Math.round(canvas.height * 0.5);
	
	for(var i = 0; i < nLines; i++)
	{
		var angle = i / nLines * 2 * Math.PI;
		var xa = x0 + Math.round(r0 * Math.cos(angle));
		var ya = y0 + Math.round(r0 * Math.sin(angle));		
		var xb = x0 + Math.round(r1 * Math.cos(angle));
		var yb = y0 + Math.round(r1 * Math.sin(angle));
		drawLineStub(xa, ya, xb, yb, canvasImage);
	}
	context.putImageData(canvasImage, 0, 0);
}
