let main = undefined
var magic = undefined
var array = undefined
var regions = undefined
var chemdata = undefined
class Main {
	constructor() {//This is the same as onload
	
		
	
	
		var nifti = require('nifti-js')
		var ndarray = require('ndarray')
		var io = require('pex-io')
		regions = ndarray(new Array(39277),[217,181]);
		io.loadBinary('data/JHU_MNI_SS_WMPM_TypeII_edited_flipy.nii', function (err, buffer) {
			var file = nifti.parse(buffer);
			console.log(file.sizes.slice().reverse());
			array = ndarray(file.data, file.sizes.slice().reverse());
			//Setup the hashlife stuff we got in the lazy canvas
			magic = new MagicMain(array,regions,chemdata);
		})
		
		/* set up XMLHttpRequest */
		var url = "data/Five_metas_Age.xlsx";
		var oReq = new XMLHttpRequest();
		oReq.open("GET", url, true);
		oReq.responseType = "arraybuffer";

		oReq.onload = function(e) {
			console.log("Loading xlsx");
			var arraybuffer = oReq.response;

			/* convert data to binary string */
			var data = new Uint8Array(arraybuffer);
			var arr = new Array();
			for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
			var bstr = arr.join("");

			/* Call XLSX */
			chemdata = XLSX.read(bstr, {type:"binary"});
			/* DO SOMETHING WITH workbook HERE */
		}

		oReq.send();
	}

	toggleSimulate() {
		this.simulate = !this.simulate
		let text = this.simulate ? 'Stop' : 'Run'
		document.getElementById('run').value = text
	}

	clear() {
		this.boardSwitcher.board.clear()
	}
}

window.onload = () => {
	document.documentElement.style.overflow = 'hidden';  // firefox, chrome
    document.body.scroll = "no"; // ie only
	main = new Main()
}


