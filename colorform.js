var m1 = document.theForm.menu1;
var m2 = document.theForm.menu2;

var m3 = document.theForm.menu4;
var m4 = document.theForm.menu5;
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
    m3len = m3.length ;
    for ( i=0; i<m3len ; i++){
        if (m3.options[i].selected == true ) {
            m4len = m4.length;
            m3.options[m2len]= new Option(m3.options[i].text);
        }
    }

    for ( i = (m3len -1); i>=0; i--){
        if (m3.options[i].selected == true ) {
            m3.options[i] = null;
        }
    }
}

function imgtwo2one() {
    m4len = m4.length ;
        for ( i=0; i<m4len ; i++){
            if (m4.options[i].selected == true ) {
                m3len = m3.length;
                m3.options[m3len]= new Option(m4.options[i].text);
            }
        }
        for ( i=(m4len-1); i>=0; i--) {
            if (m4.options[i].selected == true ) {
                m4.options[i] = null;
            }
        }
}