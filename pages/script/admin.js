"use strict";

import { createElement, isInt, redirectUnregistered, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

const employeeName = document.getElementById("employee-name");
const content = document.getElementsByTagName("main")[0];
const viewReceiptBtn = document.getElementsByClassName("view-receipt-btn")?.[0];

redirectUnregistered(content, employeeName);

viewReceiptBtn.addEventListener("click", event => {
    const orderNumLabel = createElement({ name: "header", content: "Введіть номер замовлення:" });
    const orderNumInput = createElement({ name: "input", attributes: ["type: tel", "autocomplete: off"] });
    const toReceiptPageBtn = createElement({ name: 'button', content: "Переглянути чек" });
    toReceiptPageBtn.addEventListener("click", event => {
        setWarningAfterElement(toReceiptPageBtn, '');
        if (isInt(orderNumInput.value).length === 0 && Number(orderNumInput.value) > 0) {
            const link = createElement({ name: "a", attributes: [`href: ${'/orders/receipt/' + orderNumInput.value}`, `target: _blank`] });
            link.click();
            return;
        }
        setWarningAfterElement(toReceiptPageBtn, "Некоректний номер замовлення");
    });
    showModalWindow([orderNumLabel, orderNumInput, toReceiptPageBtn],
        { className: 'view-receipt' });
})

