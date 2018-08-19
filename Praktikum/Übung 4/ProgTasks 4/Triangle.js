//Standard-Coordinates: A, B, C
var ax=30, ay=300, bx=450, by=450, cx=300, cy=30;

function setPixel(x, y, r, g, b, canvasImage)
{
	canvasImage.data[4 * (y * canvasImage.width + x) + 0] = 255 * r;
	canvasImage.data[4 * (y * canvasImage.width + x) + 1] = 255 * g;
	canvasImage.data[4 * (y * canvasImage.width + x) + 2] = 255 * b;
	canvasImage.data[4 * (y * canvasImage.width + x) + 3] = 255;
}

function max(a, b, c)
{
	if(a > b)
		if(a > c)
			return a;
		else
			return c;
	else
		if(b > c)
			return b;
		else 
			return c;
}

function min(a, b, c)
{
	if(a < b)
		if(a < c)
			return a;
		else
			return c;
	else
		if(b < c)
			return b;
		else 
			return c;
}

function drawTriangle(ax, ay, bx, by, cx, cy, canvasImage)
{
	//Set Bounding-Box
	var leftEdge = min(ax,bx,cx), rightEdge = max(ax,bx,cx);
	var topEdge = min(ay,by,cy), botEdge = max(ay,by,cy);
	
	//Draw Canvas-Background
	for(var y = 0; y < canvasImage.height; y++)
		for(var x = 0; x < canvasImage.width; x++)
			setPixel(x, y, 0.9, 0.9, 0.9, canvasImage);
	
	//Draw Bounding-Background
	for(var y = topEdge; y <= botEdge; y++)
		for(var x = leftEdge; x <= rightEdge; x++)
			setPixel(x, y, 0.8, 0.8, 0.8, canvasImage);
	
	//Precalc. distances
	var distanceAB_X = bx - ax, distanceAB_Y = by - ay;
	var distanceBC_X = cx - bx, distanceBC_Y = cy - by;
	var distanceCA_X = ax - cx, distanceCA_Y = ay - cy;
	
	//Precalc. cross products
	var crossMulAB = (bx*ay)-(by*ax);
	var crossMulBC = (cx*by)-(cy*bx);
	var crossMulCA = (ax*cy)-(ay*cx);
	
	var triangleVolume = 0.5*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));

	//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
	for(var y = topEdge; y <= botEdge; y++)
		for(var x = leftEdge; x <= rightEdge; x++)
			if((distanceAB_Y)*x-(distanceAB_X)*y+crossMulAB >= 0
			&& (distanceBC_Y)*x-(distanceBC_X)*y+crossMulBC >= 0
			&& (distanceCA_Y)*x-(distanceCA_X)*y+crossMulCA >= 0)
			{	
				var r = 0.5*(x*(by-cy)+bx*(cy-y)+cx*(y-by)) / triangleVolume;
				var g = 0.5*(ax*(y-cy)+x*(cy-ay)+cx*(ay-y)) / triangleVolume;
				var b = 0.5*(ax*(by-y)+bx*(y-ay)+x*(ay-by)) / triangleVolume;
				setPixel(x, y, r, g, b, canvasImage);			
			}
}

function drawTriangleTest(e)
{
	var xMouse = e.pageX-document.getElementById("DrawTriangleCanvas").offsetLeft;
	var yMouse = e.pageY-document.getElementById("DrawTriangleCanvas").offsetTop;
	
	if(document.getElementById("a").checked == true)
		ax=xMouse, ay=yMouse;
	
	if(document.getElementById("b").checked == true)
		bx=xMouse, by=yMouse;
	
	if(document.getElementById("c").checked == true)
		cx=xMouse, cy=yMouse;
	
	var canvas = document.getElementById("DrawTriangleCanvas");
	var context = canvas.getContext("2d");
	var canvasImage = context.createImageData(canvas.width, canvas.height);
	drawTriangle(ax, ay, bx, by, cx, cy, canvasImage);
	context.putImageData(canvasImage, 0, 0);
}