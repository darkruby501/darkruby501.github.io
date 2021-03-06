/**
*pulse detector library (<insert link to githug repository>)
*
*Copyright (c) 2014, Ruben Michael Bloom
*
*<insert Copyright statements, including those for used pacakages>
*
*
*/

/*

Headtrackr library has this at the beginning - I do not yet understand why . . . 

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.headtrackr = factory();
    }
}(this, function () {
/**
*/


/*TODO*/

//Need to fix hardcoding of video size (one variable in index file + argument checking in libraries?)
//At least change so that forehead capture rotates with head.
//Possibly need to move to solely face recognition, no object tracking.
//Get rotated head for capture.



 (function(){
//Refine FFT (e.g. set up windowing)
//Smooth outputw e.g. WMA?



pulsedetectr = {};

/**
 * @construtor
 */
 pulsedetectr.Detector = function(params) {

	if (!params) params = {}; /* never know when you're going to need params */

	var iCanvasContext, oCanvasContext, oCanvas2Context,oChartCanvasCtx; //uneeded variable here . . .

//Okay, Really gotta tidy these variables!!!!

	var start = Date.now(); //used to get timing info
	var fft = {};
	var Values = {};
	var myChart = {};
	var myHRChart = {};
	var Head_Image = {};
	var FH_image = {};
	var HeadPos = {};
	var ppg_data = {};
	var bufferSize;
	var FFTwindow;
	
	this.initialised = false;	
	this.GrnAverage;
	this.event = {};

/**/
	
	this.init = function(params){ //Okay, I have to create a canvases object. params.CanvasBag
		if (!params) params = {};

		if(params.bufferSize === undefined) params.bufferSize = 256;
		

		bufferSize = params.bufferSize + 1; //ugly way of handling variables, but how to do better?
		

		iCanvasContext = params.CanvasBag.iCanvas.getContext('2d');
		oCanvasContext = params.CanvasBag.oCanvas.getContext('2d');
		oCanvas2Context = params.CanvasBag.oCanvas2.getContext('2d');
		//oChartCanvasCtx = oChart.getContext('2d');
		// oCanvasContext.fillStyle = 'white';
		// oCanvasContext.font="20px Georgia";
		// oCanvasContext.fillText("PPG Pulse Wave",100,20)


		timer1 = new this.timer;
		timer1.init();
		
		Values.t = [];
		Values.Y = [];

		myChart = new SmoothieChart({millisPerPixel:38,interpolation:'bezier',scaleSmoothing:0.5});
		myChart.streamTo(params.CanvasBag.oChart,500);
		ppg_data = new TimeSeries();
		myChart.addTimeSeries(ppg_data, {lineWidth:2,strokeStyle:'#00ff00'})

		myHeartChart = new SmoothieChart({millisPerPixel:38,interpolation:'bezier',scaleSmoothing:1,minValue:60,maxValue:100});
		myHeartChart.streamTo(params.CanvasBag.oHeart,500);
		bpm_data = new TimeSeries();
		myHeartChart.addTimeSeries(bpm_data, {lineWidth:2,strokeStyle:'#ff0000'})


		FFTwindow = new WindowFunction(DSP.HANN);

		var messagep = document.getElementById('BufferSize');
		messagep.innerHTML = bufferSize - 1;

		this.initialised = true;
	}


	this.run = function(){

    if(this.event.x !== undefined){

		var processed = {};
		var buffer_full = false;
		
		timer1.printnreset();
		HeadPos = forhead_extract(this.event);
		this.GrnAverage = green_process();
		draw(HeadPos, this.event);

		var timenow = new Date().getTime();
		ppg_data.append(timenow, this.GrnAverage);

		Values.t.push(timenow);
		Values.Y.push(Math.round(this.GrnAverage));


		if(Values.t.length > bufferSize){ //Will need to modify for dynamic buffer size.
			Values.t.shift();
			Values.Y.shift();
		}

	}

	}


	this.getpulse = function(){

		if(this.initialised==true){
		
			//Linear interpolate values.
			if(Values.t.length < bufferSize){//if(ppg_data.data.length < bufferSize){
				buffer_full = false;
				return;
			}
			else{
				buffer_full = true;
			//Linear interpolate values.
				var tmp = lerp(Values.t,Values.Y);
				Values.even_t = tmp.X;
				Values.even_Y = tmp.Y;
				Values.mean = tmp.mean;

			

				var SAMPLERATE = Math.round(1000*bufferSize/(Values.t[bufferSize-1]-Values.t[0]));
				console.log("SAMPLERATE = %d, Time to Fill Buffer = %d",SAMPLERATE,(Values.t[bufferSize-1]-Values.t[0]));
				var BufferFillTime = Values.t[bufferSize-1]-Values.t[0];

				Values.Ylessmean = [];

				for(var i=0;i<bufferSize-1;i++){
				Values.Ylessmean[i] = Values.even_Y[i] - Values.mean; 
				}
				
				//Run FFT
				fft = new FFT(bufferSize-1,SAMPLERATE);


				 Values.Windowed = FFTwindow.process(Values.Ylessmean);
				// fft.forward(Values.Windowed);
				// Values.SpectrumWindowed = Array.	prototype.slice.call(fft.spectrum);


				fft.forward(Values.Windowed); //	fft.forward(Values.Ylessmean);
				Values.Spectrum = Array.prototype.slice.call(fft.spectrum); //Converts Float32Array to Array.


				Values.f = []; //Okay, I gotta stick this all in a function.

				var lower_f = 0.8;
				var upper_f = 2;
				var lower_idx, upper_idx;

				
				//Get frequencies for spectrogram.
				//find indices of lower and upper bound frequency range
				//Lower = 45bpm = 0.75Hz, Upper = 120bpm = 2Hz (assume for now that people are at resting heart rate).

				for (var i=0;i<fft.spectrum.length;i++){
					Values.f[i] = fft.getBandFrequency(i);

					if((lower_idx == undefined) && (Values.f[i]> lower_f)){
						lower_idx = i;
					}

					if((upper_idx == undefined) && (Values.f[i]> upper_f)){
						upper_idx = i;
					}

				}

				//Slice to get section of interest!
				var spectrum_subset = Values.Spectrum.slice(lower_idx,upper_idx);
				var frequency_subset = Values.f.slice(lower_idx,upper_idx);

				// Find peak!
				var peak_idx = 0;
				var peak_value = spectrum_subset[0];
				for (var i = 1; i < spectrum_subset.length; i++){				
					if(spectrum_subset[i] > peak_value){
						peak_value = spectrum_subset[i];
						peak_idx = i;
					}
					frequency_subset[i] = Math.round(frequency_subset[i]*60);
				}

				frequency_subset[0] = Math.round(frequency_subset[0]*60)

				this.BPM = frequency_subset[peak_idx]; //Math.round(frequency_subset[peak_idx]*60);

				var timenow = new Date().getTime();
				bpm_data.append(timenow, this.BPM);

				//Now need to plot spectum!!!
				
				spectrumCanvas.clear();
				spectrumCanvas.linechart(20,0,320,220,frequency_subset,spectrum_subset,{axis:'0 0 1 1',shade:true});
				// spectrumCanvas.linechart(0,0,620,300,Values.f,Values.Spectrum,{axis:'0 0 1 1',shade:true});
				//spectrumCanvas.linechart(0,0,620,300,Values.even_t,Values.even_Y,{axis:'0 0 1 1',shade:true});
				spectrumCanvas.text(160, 10, "Photoplethysmogram Pulse Wave Spectrogram");

				
				this.getpulse.updateMessages = function(){

					var messagep = document.getElementById('SampleRate');
					messagep.innerHTML = SAMPLERATE;
					var messagep = document.getElementById('BufferFillTime');
					messagep.innerHTML = BufferFillTime;

					var BPMres = Math.round(1000*60/BufferFillTime);
					var messagep = document.getElementById('BPMres');
					messagep.innerHTML = BPMres;

					var messagep = document.getElementById('HeartRateBPM');
					messagep.innerHTML = '[' + (pdetector.BPM - BPMres/2) + '-' + (pdetector.BPM + BPMres/2) + ']' //pdetector.BPM + " \u00B1 " + BPMres/2;


				}

				this.getpulse.updateMessages();
			}

		}
	}	

	
	this.reset = function(){
		Values.t = [];
		Values.Y = [];
		buffer_full = false;
		
		var messagep = document.getElementById('SampleRate');
		messagep.innerHTML = '';
		var messagep = document.getElementById('BufferFillTime');
		messagep.innerHTML = '';
		var messagep = document.getElementById('HeartRateBPM');
		messagep.innerHTML = ''; 
		var messagep = document.getElementById('BPMres');
		messagep.innerHTML = '';


	}
	
	this.set_event = function(event_data){
		this.event = event_data;
	}

	var forhead_extract = function(event){

		var head_pos = {};

		// x,y for centre; X,Y for top corner

		//Isolate Sub-Image
		head_pos.subimgw = event.width;
		head_pos.subimgh = event.height;
		head_pos.subimgX = (event.x - event.width/2) >> 0;
		head_pos.subimgY = (event.y - event.height/2) >> 0;

		//Offsets and multiplacative scalings for forehead

		//var fh_x = 1
		var fh_y = 0.18, //location multiplacative offset thingo
		fh_w = 0.25, //size of forehead relative to face - 25% width
		fh_h = 0.20; // 15% height
		fh_u = 0.25; //proportion of face up from cetre to forehead
		head_pos.ForeHead_h = event.width*fh_h;
		head_pos.ForeHead_w = event.height*fh_w;

		head_pos.ForeHead_x = event.x; //same x location
		head_pos.ForeHead_y = event.y - event.height*fh_u;
		head_pos.ForeHead_X = (head_pos.ForeHead_x - head_pos.ForeHead_w/2) >> 0;
		head_pos.ForeHead_Y = (head_pos.ForeHead_y - head_pos.ForeHead_h/2) >> 0;

		
		Head_Image = iCanvasContext.getImageData(head_pos.subimgX,head_pos.subimgY,head_pos.subimgw,head_pos.subimgh);
		FH_image = iCanvasContext.getImageData(head_pos.ForeHead_X,head_pos.ForeHead_Y,head_pos.ForeHead_w,head_pos.ForeHead_h);

		return head_pos;

	}


	var green_process = function(){

		//Now get green channel
		var dst = FH_image.data;
		var GreenChannelFH = [];
		var GrnSum = 0;
		/* Image Processing goes here*/
		for (var i=0; i < dst.length; i += 4) {
			dst[i+0] = 0;
			dst[i+2] = 0;

			GreenChannelFH[(i/4)>>0] = dst[i+1];
			GrnSum += dst[i+1];						
		}
		
		FH_image.data = dst;
		return Math.round(GrnSum/GreenChannelFH.length);
		
	}

	var draw = function(hp,event){
		oCanvasContext.clearRect(0,0,320,240);
		oCanvas2Context.clearRect(0,0,320,240);


		oCanvasContext.putImageData(Head_Image,hp.subimgX,hp.subimgY); /*Place sub image of head on canvas*/
		oCanvasContext.putImageData(FH_image,hp.ForeHead_X,hp.ForeHead_Y); /*Place sub image of forehead in corner of the canvas*/
		// oCanvasContext.fillStyle = 'white';
		// oCanvasContext.font="20px Georgia";
		// oCanvasContext.fillText("PPG Pulse Wave",100,20)

				//Draw Rectangle around forehead.
		oCanvas2Context.strokeStyle = "#00CC00";
		oCanvas2Context.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

		oCanvasContext.strokeStyle = "#00CC00";
		oCanvasContext.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

		oCanvas2Context.translate(event.x, event.y);
		oCanvas2Context.rotate(event.angle-(Math.PI/2));
		oCanvas2Context.strokeStyle = "#CC0000";//"#00CC00";
		oCanvas2Context.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
		oCanvas2Context.rotate((Math.PI/2)-event.angle);
		oCanvas2Context.translate(-event.x, -event.y);


	}


	this.timer = function(){
			
			var start, end, deltaT;
		
			this.init = function(){
				start = Date.now();	
			}

			this.printnreset = function(){
				end = Date.now();
				deltaT = end - start;
				console.log("deltaT = %d",deltaT);
				start = end;
			}

			return this;
		}

}



}());







// function range(start, count) {
//     if(arguments.length == 1) {
//         count = start;
//         start = 0;
//     }

//     var foo = [];
//     for (var i = 0; i < count; i++) {
//         foo.push(start + i);
//     }
//     return foo;
// }

// //linspace.js Generate linearly spaced vectors
// //Helena F. Deus (helenadeus@gmail.com)
// //200809



function lerp(x,y){
 	/*x and y must be arrays.

	x is input time, y is input values;
	Interp
	
	Interp.X are linearly spaced times.
	Interp.Y are interpolated values at linearly spaced times.

	Also returns mean of Y.

 	*/
 	
 	if (x.length != y.length){
 		console.error("lerp vectors are not of same size!");
 	}
 	
 	var Interp = {};
 	var sum = 0;
 	var N = x.length;
	

 	Interp.X = linspace(x[0],x[N-1],N);
 	Interp.Y = [];

 	for (var i = 0; i < N-1; i++){
 		Interp.Y[i] = y[i] + (Interp.X[i]-x[i])*((y[i+1]-y[i])/(x[i+1]-x[i]));
 		sum += Interp.Y[i];
  	}

  	///MEAN IS WRONG - MISSING LAST ELEMENT

  	Interp.mean = Math.round(sum/N-1);

  	return Interp;

	function linspace(d1,d2,n) {
	                
	        j=0;
	        var L = new Array();
	        
	        while (j<=(n-1)) {
	        
	                var tmp1 = j*(d2-d1)/(Math.floor(n)-1);
	                var tmp2 = Math.ceil((d1+tmp1)*10000)/10000;
	                L.push(tmp2);
	                j=j+1;
	        }
	        
	        return L;
	 }

}

function argmax(array){
	var index_max = 0;
	for(var i=1; i < array.length; i++){
		if(array[index_max]<array[i]){
			index_max = i;
		}
	}
	return index_max;
}




 
