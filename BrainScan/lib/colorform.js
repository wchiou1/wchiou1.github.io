var m1 = document.getElementById('select1');
var m2 = document.getElementById('select2');
var m4 = document.getElementById('select4');
var m5 = document.getElementById('select5');
function colorone2two() {
    m1len = m1.length ;
    for ( i=0; i<m1len ; i++){
        if (m1.options[i].selected == true ) {
            m2len = m2.length;
            m2.options[m2len]= new Option(m1.options[i].text);
        }
    }

    for ( i = (m1len -1); i>=0; i--){
        if (m1.options[i].selected == true ) {
            m1.options[i] = null;
        }
    }
}

function colortwo2one() {
    m2len = m2.length ;
	for ( i=0; i<m2len ; i++){
		if (m2.options[i].selected == true ) {
			m1len = m1.length;
			m1.options[m1len]= new Option(m2.options[i].text);
		}
	}
	for ( i=(m2len-1); i>=0; i--) {
		if (m2.options[i].selected == true ) {
			m2.options[i] = null;
		}
	}
}

function imgone2two() {
    m4len = m4.length ;
    for ( i=0; i<m4len ; i++){
        if (m4.options[i].selected == true ) {
            m5len = m5.length;
            m5.options[m5len]= new Option(m4.options[i].text);
        }
    }

    for ( i = (m4len -1); i>=0; i--){
        if (m4.options[i].selected == true ) {
            m4.options[i] = null;
        }
    }
}

function imgtwo2one() {
    m5len = m5.length ;
	for ( i=0; i<m5len ; i++){
		if (m5.options[i].selected == true ) {
			m4len = m4.length;
			m4.options[m4len]= new Option(m5.options[i].text);
		}
	}
	for ( i=(m5len-1); i>=0; i--) {
		if (m5.options[i].selected == true ) {
			m5.options[i] = null;
		}
	}
}