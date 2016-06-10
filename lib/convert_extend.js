function lab_to_xyz(lab){

	
	var var_Y = ( lab.L + 16 ) / 116;
	var var_X = lab.a / 500 + var_Y;
	var var_Z = var_Y - lab.b / 200;

	if ( Math.pow(var_Y,3 )> 0.008856 ) var_Y = Math.pow(var_Y,3);
	else                      var_Y = ( var_Y - 16 / 116 ) / 7.787;
	if ( Math.pow(var_X,3 ) > 0.008856 ) var_X = Math.pow(var_X,3);
	else                      var_X = ( var_X - 16 / 116 ) / 7.787;
	if ( Math.pow(var_Z,3 ) > 0.008856 ) var_Z = Math.pow(var_Z,3);
	else                      var_Z = ( var_Z - 16 / 116 ) / 7.787;
	
	var ref_X =  95.047;     //Observer= 2‹, Illuminant= D65
	var ref_Y = 100.000;
	var ref_Z = 108.883;
	
	var X = ref_X * var_X;     
	var Y = ref_Y * var_Y;     
	var Z = ref_Z * var_Z;
	
	var xyz={'X':X, 'Y':Y, 'Z':Z};
	return xyz;
}

function xyz_to_rgb(xyz){
	var var_X = xyz.'X' / 100;        //X from 0 to  95.047      (Observer = 2‹, Illuminant = D65)
	var var_Y = xyz.'Y' / 100;        //Y from 0 to 100.000
	var var_Z = xyz.'Z' / 100;        //Z from 0 to 108.883

	var var_R = var_X *  3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
	var var_G = var_X * -0.9689 + var_Y *  1.8758 + var_Z *  0.0415;
	var var_B = var_X *  0.0557 + var_Y * -0.2040 + var_Z *  1.0570;

	if ( var_R > 0.0031308 ) var_R = 1.055 * ( Math.pow(var_R , ( 1 / 2.4 )) ) - 0.055;
	else                     var_R = 12.92 * var_R;
	if ( var_G > 0.0031308 ) var_G = 1.055 * ( Math.pow(var_G , ( 1 / 2.4 )) ) - 0.055;
	else                     var_G = 12.92 * var_G;
	if ( var_B > 0.0031308 ) var_B = 1.055 * ( Math.pow(var_B , ( 1 / 2.4 )) ) - 0.055;
	else                     var_B = 12.92 * var_B;

	var R = var_R * 255;
	var G = var_G * 255;
	var B = var_B * 255;
	
	var rgb={'R':R, 'G':G, 'B':B};
	return rgb;
}

function lab_to_rgb(lab){
	return xyz_to_rgb(lab_to_xyz(lab));
}