//Setup various global variables
var rect = {},
    first = true,
    lockedToRez = false,
    mouseX,
    mouseY,
    ratioX,
    ratioY,
    scaleX = 1.0,
    scaleY = 1.0,
    closeEnough = 10,
    zoomLevel = 1,
    dragTL = false,
    dragBL = false,
    dragTR = false,
    dragBR = false;

var orig = null;
var origWrapper = document.getElementById("OrigWrapper");
var spectrum = document.getElementById("Spectrum").getContext("2d");
var notchSpec = document.getElementById("NotchSpec").getContext("2d");
var result1 = document.getElementById("Result1").getContext("2d");
var result2 = document.getElementById("Result2").getContext("2d");

//Take the chosen image, bind all the handlers, and process it
function processImage(anImage, id) {
	$(anImage).on('load', function () {
		//Calculate various image dimensions
		var imgWidth = anImage.width,
			imgHeight = anImage.height,
			largestSide = imgWidth > imgHeight ? imgWidth : imgHeight,
			specWidth = Math.pow(2, Math.ceil(Math.log(largestSide) / Math.log(2))),
			specHeight = specWidth,
			zoomImgWidth = imgWidth,
			zoomImgHeight = imgHeight,
			zoomSpecWidth = specWidth,
			zoomSpecHeight = specHeight,
			aFFT = null,
			savedFFT = null;

		//Set every canvas to the correct size
		spectrum.canvas.width = notchSpec.canvas.width = specWidth;
		spectrum.canvas.height = notchSpec.canvas.height = specHeight;
		if(id===1){
			result1.canvas.width = imgWidth;
			result1.canvas.height = imgHeight;
			result1.fillStyle = '#000000';
			result1.fillRect(0, 0, result1.canvas.width, result1.canvas.height);
		}
		else{
			result2.canvas.width = imgWidth;
			result2.canvas.height = imgHeight;
			result2.fillStyle = '#000000';
			result2.fillRect(0, 0, result2.canvas.width, result2.canvas.height);
		}

		ratioX = specWidth / imgWidth;
		ratioY = specHeight / imgHeight;
		zoomLevel = 1;
		rect = {};

		//Clear the canvas objects
		spectrum.fillStyle = '#000000';
		spectrum.fillRect(0, 0, specWidth, specHeight);
		

		//Initalize the backend objects
		aFFT = new Transform(specWidth * specHeight);
		savedFFT = new Transform(specWidth * specHeight);
		FFT.init(specWidth, specHeight);
		Filtering.init(specWidth, specHeight, imgWidth, imgHeight);
		SpecMaker.init(spectrum);


		spectrum.drawImage(anImage, 0, 0, imgWidth, imgHeight);

		//Retrieve the zero padded data
		var src = spectrum.getImageData(0, 0, specWidth, specHeight),
			data = src.data,
			i = 0;

		for (var y = 0; y < specHeight; y++) {
			i = y * specWidth;
			for (var x = 0; x < specWidth; x++) {
				aFFT.rReal[i + x] = data[(i << 2) + (x << 2)];
				aFFT.gReal[i + x] = data[(i << 2) + (x << 2) + 1];
				aFFT.bReal[i + x] = data[(i << 2) + (x << 2) + 2];
				aFFT.rImag[i + x] = aFFT.gImag[i + x] = aFFT.bImag[i + x] = 0.0;
			}
		}

		//Perform the 2D FFT
		operate(aFFT, FFT.fft2d);

		//Draw out the initial spectrum
		deepCopy(aFFT, savedFFT);
		//applySpec("Measure");
		//console.log($('input[name=ftype]:checked').val());
		//deepCopy(savedFFT, aFFT);

		//bindHandlers();

		applySpec('no filter');
		deepCopy(savedFFT, aFFT);
		if (typeof rect.w !== "undefined" && typeof rect.h !== "undefined") {
			notchSpec.drawBox();
		}
		//initalLockRez();
		
		notchSpec.clearRect(0, 0, notchSpec.canvas.width, notchSpec.canvas.height);

		var filterType;
		var button = document.getElementById("pass"+(id+1));
		if(highPass[id]){
			filterType="HighPass";
		}
		else{
			filterType="LowPass";
		}
	
		applySpec(filterType);
		deepCopy(savedFFT, aFFT);
		
		applySpec(filterType);
		applyChanges();

		/* This function performs filtering on the image's FFT
		 * and draws out the result to the spectrum canvas.
		 */
		function applySpec(type) {
			console.log(Number(document.getElementById("cutoff1").value));
			var radius;
			if(id===1)
				radius=Number(document.getElementById("cutoff1").value);
			else
				radius=Number(document.getElementById("cutoff2").value);
			var bandwidth = 0,
				sharpness = 0,
				butterOrder = 0,
				filterStyle = "Ideal";

			operate(aFFT, Filtering.shiftQuads);

			if (type === 'HighPass') {
				operate(aFFT, Filtering.highPass, radius, filterStyle, butterOrder);
			} else if (type === 'LowPass') {
				operate(aFFT, Filtering.lowPass, radius, filterStyle, butterOrder);
			} else if (type === 'BandPass') {
				operate(aFFT, Filtering.bandPass, radius, filterStyle, butterOrder, bandwidth);
			} else if (type === 'BandStop') {
				operate(aFFT, Filtering.bandStop, radius, filterStyle, butterOrder, bandwidth);
			} else if (type === 'Sharpen') {
				operate(aFFT, Filtering.sharpen, radius, filterStyle, butterOrder, sharpness);
			} else if (type === 'Notch') {
				var notchSrc = notchSpec.getImageData(0, 0, specWidth, specHeight),
					notchData = notchSrc.data;
				operate(aFFT, Filtering.notch, notchData);
			}

			SpecMaker.create(aFFT, "Basic");
			operate(aFFT, Filtering.shiftQuads);
			$('#SaveSpecHider').show();
		}

		/* This function performs the inverse FFT and draws
		 * out the filtered result to the result canvas.
		 */
		function applyChanges() {
			var src = spectrum.getImageData(0, 0, specWidth, specHeight),
				data = src.data,
				i = 0,
				rVal = 0,
				gVal = 0,
				bVal = 0,
				point = 0;

			operate(aFFT, FFT.ifft2d);

			for (var y = 0; y < specHeight; y++) {
				i = y * specWidth;
				for (var x = 0; x < specWidth; x++) {
					rVal = aFFT.rReal[i + x];
					gVal = aFFT.gReal[i + x];
					bVal = aFFT.bReal[i + x];
					rVal = rVal > 255 ? 255 : rVal < 0 ? 0 : rVal;
					gVal = gVal > 255 ? 255 : gVal < 0 ? 0 : gVal;
					bVal = bVal > 255 ? 255 : bVal < 0 ? 0 : bVal;
					point = (i << 2) + (x << 2);
					data[point] = rVal;
					data[point + 1] = gVal;
					data[point + 2] = bVal;
				}
			}
			if(id===1)
				result1.putImageData(src, 0, 0);
			else
				result2.putImageData(src, 0, 0);
			deepCopy(savedFFT, aFFT);
			$('#SaveResultHider').show();
		}
	});
}

function testFilter(data,id) {
	var anImage = new Image();
	console.log()
	anImage.src = data;
	anImage.width=targ.width;
	anImage.height=targ.height;
	targ.width=iconWidth;
	targ.height=iconHeight;
    processImage(anImage,id);
}