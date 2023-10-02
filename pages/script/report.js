"use strict";

import { createElement, isFloat, isInt, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

const generateReportBtn = document.getElementById("generate-report-btn");
const reportContainer = document.getElementById("report");
let dateTimeComponents = document.querySelectorAll('#datetime-period > .datetime-component');
dateTimeComponents = {
    from: {
        day: dateTimeComponents[0].children[1],
        month: dateTimeComponents[0].children[2],
        year: dateTimeComponents[0].children[3]
    },
    to: {
        day: dateTimeComponents[1].children[1],
        month: dateTimeComponents[1].children[2],
        year: dateTimeComponents[1].children[3]
    },
}

let currentDate = new Date();
dateTimeComponents.to.day.value = currentDate.getDate();
dateTimeComponents.to.month.value = currentDate.getMonth() + 1;
dateTimeComponents.to.year.value = currentDate.getFullYear();

let orders = [];
let ordersToDisplay = [];

generateReportBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/generate-report", {
            method: "PROPFIND",
            body: JSON.stringify(requestBody),
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {

            }
        }
    } catch (error) {
        console.error(error.message);
        alert("Error");
    }
})

function renderOrders() {
    if (!orders || orders.length === 0) {
        reportContainer.textContent = "Невидані замовлення відсутні.";
        return;
    }
    // console.log(orders[0]);
    // console.log(orders.length);
    let fromTimestamp = searchInputs.dateTimeComponents.from.day.value === '' ?
        0 : Date.parse(new Date(
            Number(searchInputs.dateTimeComponents.from.year.value),
            Number(searchInputs.dateTimeComponents.from.month.value) - 1,
            Number(searchInputs.dateTimeComponents.from.day.value),
            0, 0, 0, 0 // seconds and milliseconds
        )) || 0;
    let toTimestamp = searchInputs.dateTimeComponents.to.day.value === '' ?
        Infinity : Date.parse(new Date(
            Number(searchInputs.dateTimeComponents.to.year.value),
            Number(searchInputs.dateTimeComponents.to.month.value) - 1,
            Number(searchInputs.dateTimeComponents.to.day.value),
            59, 59, 59, 999 // seconds and milliseconds
        )) || Infinity;
    // console.log(fromTimestamp, toTimestamp);
    if (fromTimestamp > toTimestamp) {
        setWarningAfterElement(searchBtn, 'У діапазоні дат початок більше ніж кінець.');
    } else {
        ordersToDisplay = ordersToDisplay.filter(order => {
            let orderTimestamp = new Date(order.datetime).setSeconds(0, 0);
            // new Date() adds timezone offset to ISOString
            // console.log(order.datetime, orderTimestamp);
            return orderTimestamp >= fromTimestamp && orderTimestamp <= toTimestamp;
        })
    }
    if (ordersToDisplay.length === 0) {
        reportContainer.textContent = "Немає невиданих замовлень, що задовільняють фільтри.";
        return;
    }
    reportContainer.innerHTML = '';
    ordersToDisplay?.forEach(order => {
        reportContainer.append(order.element || createOrderElement(order).element);
    })
}
function createOrderElement(order) {
    order.element = createElement({ name: 'div', class: 'order' });
    const receiptNum = createElement({ class: 'receipt_num', content: 'Замовлення №' + order.receipt_num });
    order.element.append(receiptNum);
    const customerName = createElement({ class: 'customer_name', content: 'Покупець: ' + order.customer_name });
    order.element.append(customerName);
    const customerPhoneNum = createElement({ class: 'customer_phone_num', content: 'Номер телефону покупця: ' + order.customer_phone_num });
    order.element.append(customerPhoneNum);
    const datetime = createElement({ class: 'datetime', content: 'Дата замовлення: ' + new Date(order.datetime).toLocaleString() });
    order.element.append(datetime);
    const cost = createElement({ class: 'cost', content: 'Вартість: ' + order.cost + ' грн.' });
    order.element.append(cost);
    const orderItems = createElement({ class: 'order-items' });
    order.orderItems.forEach(orderItem => {
        let text = ``;
        orderItems.insertAdjacentHTML("beforeend", `<div class="order-item">${text}</div>`);
    })
    order.element.append(orderItems);
    return order;
}
generateReportBtn.addEventListener('click', event => {
    let everythingIsCorrect = true, message = '';
    if (searchInputs.receipt_num.value.length > 0 && isInt(searchInputs.receipt_num.value).length > 0) {
        message = 'Номер чеку повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    } if (searchInputs.customer_phone_num.value.length > 0 && isInt(searchInputs.customer_phone_num.value).length > 0) {
        message = 'Номер телефону покупця повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    }
    for (const dateTimeComponentKey in searchInputs.dateTimeComponents) {
        const dateTimeComponent = searchInputs.dateTimeComponents[dateTimeComponentKey];
        let dateTimeComponentIsUsed = false;
        for (const key in dateTimeComponent) {
            dateTimeComponent[key].style.borderColor = '';
            if (!dateTimeComponentIsUsed && dateTimeComponent[key].value.length > 0) {
                // console.log(dateTimeComponentKey, dateTimeComponent[key]);
                dateTimeComponentIsUsed = true;
            }
        }
        // console.log(dateTimeComponentIsUsed);
        if (!everythingIsCorrect || dateTimeComponentIsUsed === false) {
            continue;
        }
        for (const key in dateTimeComponent) {
            if (key === 'hour' || key === 'minute') {
                continue;
            }
            if (dateTimeComponent[key].value.length == 0) {
                if (key === 'year') {
                    dateTimeComponent[key].value = new Date().getFullYear();
                    continue;
                }
                message = `День та місяць 
                    ${dateTimeComponentKey === 'to' ? 'кінця' : 'початку'} 
                    діапазону дат повинні бути заповнені.`;
                dateTimeComponent[key].style.borderColor = 'red';
                everythingIsCorrect = false;
                break;
            }
        }
        if (!everythingIsCorrect) {
            continue;
        }
        if (isInt(dateTimeComponent.day).length > 0 ||
            isInt(dateTimeComponent.month).length > 0 ||
            isInt(dateTimeComponent.year).length > 0 ||
            !dayAndMonthAreCorrect(dateTimeComponent.day, dateTimeComponent.month)) {
            message = `Некоректна або неіснуюча дата 
                ${dateTimeComponentKey === 'to' ? 'кінця' : 'початку'} 
                діапазону дат.`;
            everythingIsCorrect = false;
            continue;
        }
        if (isInt(dateTimeComponent.hour).length > 0 ||
            isInt(dateTimeComponent.minute).length > 0 ||
            !hourAndMinuteAreCorrect(dateTimeComponent.hour, dateTimeComponent.minute)) {
            message = `Некоректний або неіснуючий час 
            ${dateTimeComponentKey === 'to' ? 'кінця' : 'початку'} 
            діапазону дат.`;
            everythingIsCorrect = false;
            // continue;
        }
    }
    if (everythingIsCorrect === false) {
        setWarningAfterElement(searchBtn, message);
        return;
    }
    setWarningAfterElement(searchBtn, '');
    renderOrders();
})
sortingSection.addEventListener('change', event => {
    let closestSelect = event.target.closest('select');
    if (closestSelect === sortBySelect || closestSelect === sortOrderSelect) {
        searchBtn.click();
    }
})
ordersContainer.addEventListener('click', async event => {
    // 1: order deletion logic, 2: order issuance logic
    // 1: order deletion logic
    const deleteOrderBtn = event.target.closest('.delete-order-btn');
    if (deleteOrderBtn) {
        try {
            if (localStorage.getItem("employeeName") !== 'Admin') {
                throw new Error("Employee is not admin");
            }
            let orderIndex = [...ordersContainer.querySelectorAll('.delete-order-btn')].findIndex(btn => btn === deleteOrderBtn);
            let requestBody = {
                receiptNum: ordersToDisplay[orderIndex].receipt_num,
                employeeName: localStorage.getItem("employeeName")
            };
            let response = await fetch(location.origin + "/orders/delete", {
                method: "DELETE",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || "Server error.");
                } else {
                    const orderElement = deleteOrderBtn.closest(".order");
                    if (!orderElement) {
                        refreshBtn.click();
                    } else {
                        orderElement.classList.add("deleted");
                        orderElement.addEventListener("transitionend", event => {
                            orderElement.remove();
                            refreshBtn.click();
                        })
                    }
                }
            }
        } catch (error) {
            console.error(error.message);
            alert("Error");
        }
        return;
    }
    // 2: order issuance logic
    const issuanceBtn = event.target.closest('.issuance-btn');
    if (!issuanceBtn) {
        return;
    }
    let orderIndex = [...ordersContainer.querySelectorAll('.issuance-btn')].findIndex(btn => btn === issuanceBtn);
    const header = createElement({ name: "header", content: 'Видача замовлення' });
    const сostElem = createElement({ class: 'cost', content: 'Вартість: ' + ordersToDisplay[orderIndex].cost + ' грн.' });
    const paidLabel = createElement({ name: "header", content: "Заплачено (грн.):" });
    const paidInput = createElement({ name: "input" });
    paidInput.setAttribute("autocomplete", "off");
    const changeLabel = createElement({ name: "header", content: 'Введіть заплачену суму' });
    const issueBtn = createElement({ name: 'button', content: "Видати", class: "issue-btn" });
    issueBtn.style.display = "none";
    paidInput.addEventListener("input", event => {
        issueBtn.style.display = "none";
        let warningText = "";
        if (paidInput.value.length === 0) {
            warningText = 'Введіть заплачену суму';
        } else {
            let numWarning = isFloat(paidInput.value);
            if (numWarning.includes("more than once")) {
                warningText = "Десяткова крапка не може зустрічатися у числі більш ніж 1 раз!";
            } else if (numWarning.includes("Incorrect")) {
                warningText = 'Некоретне значення заплаченої суми';
            }
        }
        if (warningText.length > 0) {
            setWarningAfterElement(paidInput, warningText);
            changeLabel.textContent = "";
            return;
        }
        setWarningAfterElement(paidInput, '');
        let change = Number(paidInput.value.split(",").join(".")) - ordersToDisplay[orderIndex].cost;
        if (change < 0) {
            changeLabel.textContent = 'Сплачено недостатньо';
        } else {
            changeLabel.textContent = `Решта: ${change.toFixed(2)} грн.`;
            issueBtn.style.display = "";
        }
    })
    issueBtn.addEventListener('click', async event => {
        paidInput.dispatchEvent(new Event('input'));
        if (changeLabel.textContent.match(/Решта: [\d.,]+ грн./)) {
            try {
                let requestBody = {
                    receiptNum: ordersToDisplay[orderIndex].receipt_num,
                    employeeName: localStorage.getItem("employeeName"),
                    paid: Number(paidInput.value.split(",").join("."))
                };
                let response = await fetch(location.origin + "/orders/issue", {
                    method: "PATCH",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message || "Server error.");
                    } else {
                        refreshBtn.click();
                        let receiptLink = document.createElement("a");
                        receiptLink.setAttribute('target', '_blank');
                        receiptLink.href = location.href + `/${requestBody.receiptNum}`;
                        receiptLink.click();
                    }
                }
            } catch (error) {
                console.error(error.message);
                alert("Error");
                return;
            }
            event.target.closest(".modal-window").closeWindow();
        } else {
            alert(paidInput.nextElementSibling.textContent
                || changeLabel.textContent ||
                "Введіть коректне і достатнє значення заплаченої суми");
        }
    })
    showModalWindow([header, сostElem,
        paidLabel, paidInput, changeLabel, issueBtn],
        { className: 'issuance' });
})