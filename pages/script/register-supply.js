"use strict";

import { redirectUnregistered } from "./useful-for-client.js";

const content = document.getElementsByTagName("main")[0];
const consignmentNoteInput = document.querySelector('.consignment-note-input');

redirectUnregistered(content, null);

consignmentNoteInput.addEventListener("change", event => {
    console.log("change");
    let file = consignmentNoteInput.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    //if you need to read a csv file with a 'ISO-8859-1' encoding
    /*reader.readAsText(file,'ISO-8859-1');*/
    reader.onload = function (event) { // when the file finish load
        let textCsv = event.target.result;
        console.log(textCsv);
        let rows = textCsv.split('\n');
        for (let i = 0; i < rows.length; i++) {
            let cols = rows[i].split(';');
            for (let j = 0; j < cols.length; j++) {
                let value = cols[j];
                console.log(value);
            }
            console.log("end col");
        }
    }
})