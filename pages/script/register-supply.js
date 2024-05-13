"use strict";

import { createElement, formatPrice, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

const content = document.getElementsByTagName("main")[0];
const storageOutput = document.querySelector(".storage");
const loadFileBtn = document.querySelector(".load-file-btn");
const refreshBtn = document.querySelector(".refresh-btn");

if (localStorage.getItem("employeeName") === null) {
    location.href = location.origin + "/orders";
}

refreshBtn.addEventListener("click", async event => {
    try {
        let response = await fetch(location.origin + "/get-storage", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                // console.log(result.products);
                if (result.products.length === 0) {
                    storageOutput.textContent = "Немає товарів у базі даних.";
                    return;
                }
                storageOutput.textContent = "";
                result.products.forEach(product => {
                    storageOutput.insertAdjacentHTML('beforeend',
                        `<div>${product.brand}</div>
                        <div>${product.model}</div>
                        <div>${formatPrice(product.price)}</div>
                        <div>${product.amount}</div>`);
                })
                storageOutput.insertAdjacentHTML('afterbegin',
                    `<div>Бренд</div>
                    <div>Модель</div>
                    <div>Ціна (грн.)</div>
                    <div>Кількість (штук)</div>`);
                content.style.display = '';
            }
        }
    } catch (error) {
        console.error(error.message);
        if (!error.message.includes("Failed to fetch")) {
            alert("Error");
        }
    }
});

refreshBtn.click();

let products = [];

loadFileBtn.addEventListener('click', event => {
    const consignmentNoteInputWrapper = createElement({ name: "div", class: 'input-wrapper' });
    consignmentNoteInputWrapper.innerHTML = `<span>
    Перетягніть сюди .csv файл накладної чи натисніть для вибору файлу</span>    
    <input type="file" accept=".csv" class="consignment-note-input"></div>`;
    const consignmentNoteInput = consignmentNoteInputWrapper.querySelector('.consignment-note-input');
    const output = createElement({ name: "output", class: 'table', style: "display: none" });
    const registerSupplyBtn = createElement({ name: 'button', content: "Оформити поставку", class: "register-supply-btn", style: "display: none" });
    const cancelBtn = createElement({ name: 'button', content: "Скасувати", class: "cancel-btn", style: "margin-left: 0;" });
    const buttons = createElement({ class: "buttons" });
    buttons.append(registerSupplyBtn, cancelBtn);
    showModalWindow([consignmentNoteInput.parentElement, output,
        buttons],
        { className: 'load-file-window' });
    cancelBtn.addEventListener("click", async event => {
        event.target.closest(".modal-window").closeWindow();
    })
    consignmentNoteInput.addEventListener("change", event => {
        // console.log(consignmentNoteInput.files[0]);
        products = [];
        let file = consignmentNoteInput.files[0];
        let reader = new FileReader();
        reader.readAsText(file, "windows-1251");
        reader.onload = function (event) { // when the file finish load
            let textCsv = event.target.result;
            let supplyCost = 0, errorMessage = "";
            let rows = textCsv.split('\n');
            if (rows < 4 || (rows[rows.length - 1] === "" && rows.length == 4)) {
                errorMessage = "Некоректний формат файлу накладної. Завантажте коректний файл."
            }
            for (let i = 2; i < rows.length - 1; i++) {
                if (errorMessage.length > 0) {
                    break;
                }
                let cols = rows[i].split(';');
                if (cols[0].includes("Оформив")) {
                    break;
                }
                if (cols.length < 6 || cols[5] == '\r') {
                    errorMessage = "Некоректний формат файлу накладної. Завантажте коректний файл.";
                    continue;
                }
                let productInfo = {
                    brand: cols[1],
                    model: cols[2],
                    amount: Number(cols[4]) || "-",
                    cost: Number(cols[5]) || "-"
                };

                if (Number.isNaN(Number(productInfo.amount)) || Number.isNaN(Number(productInfo.cost))) {
                    errorMessage = "Некоректні дані накладної. Завантажте коректний файл.";
                    continue;
                }
                for (const key in productInfo) {
                    if (key === "cost") {
                        output.insertAdjacentHTML('beforeend', `<div>${formatPrice(productInfo[key])}</div>`);
                        continue;
                    }
                    output.insertAdjacentHTML('beforeend', `<div>${productInfo[key]}</div>`);
                }
                products.push(productInfo);
                supplyCost = supplyCost + productInfo.cost;
            }
            if (errorMessage.length > 0) {
                alert(errorMessage);
                return;
            }
            output.insertAdjacentHTML('afterbegin',
                `<div>Бренд</div>
                <div>Модель</div>
                <div>Кількість (штук)</div>
                <div>Ціна (грн.)</div>`);
            output.insertAdjacentHTML('afterend',
                `<div style="margin-top: 3px">
                Плата за поставку: ${formatPrice(supplyCost)} грн.</div>`);
            consignmentNoteInput.parentElement.remove();
            registerSupplyBtn.style.display = "";
            cancelBtn.style = "";
            output.style.display = "";
        }
    })
    registerSupplyBtn.addEventListener('click', async event => {
        if (registerSupplyBtn.style.backgroundColor == "gray") {
            return;
        }
        registerSupplyBtn.style.backgroundColor = "gray";
        try {
            let requestBody = {
                products,
                employeePhoneNum: localStorage.getItem('employeePhoneNum')
            };
            let response = await fetch(location.origin + "/register-supply", {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
                if (!result.success) {
                    if (result.message.includes("Некоректні дані про телефон")) {
                        alert(result.message);
                        return;
                    }
                    throw new Error(result.message || "Server error.");
                } else {
                    setWarningAfterElement(buttons, "Поставку оформлено.");
                    refreshBtn.click();
                    cancelBtn.textContent = "Закрити вікно";
                    // cancelBtn.click();// close the modal window
                }
            }
        } catch (error) {
            event.preventDefault();
            console.error(error.message);
            alert("Error");
        }
    })

})