function cancel(e) {
	e.preventDefault();
}

function read(e, callback){
	e = e || window.event;
	cancel(e);
	e.stopPropagation();

	let files = e.dataTransfer.files; // Array of all files
	readFiles(files, callback);
}

function readFiles(files, callback){
	if(files.length<=0)//Length is zero! How the hell did that happen?
		return;
	var first = true;
	var file=files[0];
	var reader = new FileReader();
	reader.file=file;
	reader.onload = function(e2) { // finished reading file data.
		//Print out the file
		var lines = e2.target.result.split('\n');
		var filtered = [];
		//Remove any lines that have a #
		for(var i=0;i<lines.length;i++) {
			if(lines[i].indexOf('#')==-1)
				filtered.push(lines[i]);
		}
		var result="";
		//Put the rest of the lines in one string
		for(var i=1;i<filtered.length;i++){
			result+=filtered[i];
		}
		var finished = [];
		finished.push(filtered[0]);
		//Split the lines along the $ and put them in with the dimensions line
		var resultsSplit = result.split('$');
		for(var i=0;i<resultsSplit.length;i++){
			finished.push(resultsSplit[i]);
		}

		callback(finished)
	}
	reader.readAsText(file); // start reading the file data.
}

// Class to handle dragging and dropping files onto an element
class FileDrop {
	constructor(element, callback) {
		let canvas = document.getElementById(element);

		canvas.addEventListener('dragover', cancel);
		canvas.addEventListener('dragenter', cancel);
		canvas.addEventListener('drop', e => {
			read(e, callback)
		});
	}
}
