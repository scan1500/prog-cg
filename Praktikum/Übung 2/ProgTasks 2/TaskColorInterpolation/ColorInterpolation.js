var canvasImage1 = null;
var canvasImage2 = null;

function max(a, b, c)
{
	if(a > b)
	{
		if(a > c)
		{
			return a;
		} else
		{
			return c;
		}
	} else
	{
		if(b > c)
		{
			return b;
		} else 
		{
			return c;
		}
	}
}


function min(a, b, c)
{
	if(a < b)
	{
		if(a < c)
		{
			return a;
		} else
		{
			return c;
		}
	} else
	{
		if(b < c)
		{
			return b;
		} else 
		{
			return c;
		}
	}
}


function RGB2HSV(r, g, b)
{
	var h, s, v;
	v = max(r, g, b);
	var delta = v - min(r, g, b);
	if(v == 0)
	{
		s = 0;
	} else
	{
		s = delta / v;
	}

	if(delta == 0)
	{
		h = 0;
	} else 
	if(v == r)
	{
		h = 60 * (g - b) / delta + 0;
	} else if(v == g)
	{
		h = 60 * (b - r) / delta + 120;
	
	} else
	{
		h = 60 * (r - g) / delta + 240;
	}
	
	if(h < 0)
	{
		h += 360;
	}
	return [h, s, v];
}

function HSV2RGB(H, S, V)
{
	var r,g,b;
	var h = Math.floor(H/60.0);
	var f = H/60.0 - h;
	var p = V * (1 - S);
	var q = V * (1 - S * f);
	var t = V * (1 - S * (1 - f));
	
	if(h == 1)
	{
		r = q;
		g = V;
		b = p;
	} else if(h == 2)
	{
		r = p;
		g = V;
		b = t;
	} else if(h == 3)
	{
		r = p;
		g = q;
		b = V;
	} else if(h == 4)
	{
		r = t;
		g = p;
		b = V;
	} else if(h == 5)
	{
		r = V;
		g = p;
		b = q;
	} else 
	{
		r = V;
		g = t; 
		b = p;
	}
	return [r, g, b];
}

function gradientBoxRGB(x0, y0, width, height, leftColorR, leftColorG, leftColorB, rightColorR, rightColorG, rightColorB)
{	
	for (var y = 0; y < height; y++)
	{
		for (var x = 0; x < width; x++) 
		{
			canvasImage1.data[4 * (y * width + x) + 0] = (1-(x/(width-1)))*leftColorR + (x/(width-1))*rightColorR;
			canvasImage1.data[4 * (y * width + x) + 1] = (1-(x/(width-1)))*leftColorG + (x/(width-1))*rightColorG;
			canvasImage1.data[4 * (y * width + x) + 2] = (1-(x/(width-1)))*leftColorB + (x/(width-1))*rightColorB;
			canvasImage1.data[4 * (y * width + x) + 3] = 255;	
		}
	}
}

function gradientBoxHSV(x0, y0, width, height, leftColorR, leftColorG, leftColorB, rightColorR, rightColorG, rightColorB)
{
	// 1. Convert RGB to HSV
	var colorsLeftHSV = RGB2HSV(leftColorR, leftColorG, leftColorB); 
	var colorsRightHSV = RGB2HSV(rightColorR, rightColorG, rightColorB); 
	
	for (var y = 0; y < height; y++)
	{
		for (var x = 0; x < width; x++) 
		{
			// 2. Interpolate HSV-Values
			var colorH = (1-(x/(width-1)))*colorsLeftHSV[0] + (x/(width-1))*colorsRightHSV[0];
			var colorS = (1-(x/(width-1)))*colorsLeftHSV[1] + (x/(width-1))*colorsRightHSV[1];
			var colorV = (1-(x/(width-1)))*colorsLeftHSV[2] + (x/(width-1))*colorsRightHSV[2];
			
			// 3. Convert HSV to RGB
			var colorsRGB = HSV2RGB(colorH, colorS, colorV);
			
			// 4. Set RGB-Values
			canvasImage2.data[4 * (y * width + x) + 0] = colorsRGB[0];
			canvasImage2.data[4 * (y * width + x) + 1] = colorsRGB[1];
			canvasImage2.data[4 * (y * width + x) + 2] = colorsRGB[2];
			canvasImage2.data[4 * (y * width + x) + 3] = 255;	
		}
	}
}

function colorInterpolationTest()
{
	var canvas1 = document.getElementById("ColorInterpolationCanvasRGB");
	var canvas2 = document.getElementById("ColorInterpolationCanvasHSV");
	var context1 = canvas1.getContext("2d");
	var context2 = canvas2.getContext("2d");
	context1.clearRect(0, 0, canvas1.width, canvas1.height);
	context2.clearRect(0, 0, canvas2.width, canvas2.height);
	canvasImage1 = context1.createImageData(canvas1.width, canvas1.height);
	canvasImage2 = context2.createImageData(canvas2.width, canvas2.height);
	
	gradientBoxRGB(0, 0, 512, 128, 255, 0, 0, 0, 0, 255);
	gradientBoxHSV(0, 0, 512, 128, 255, 0, 0, 0, 0, 255);
	
	context1.putImageData(canvasImage1, 0, 0);
	context2.putImageData(canvasImage2, 0, 0);
}

