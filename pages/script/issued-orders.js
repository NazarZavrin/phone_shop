"use strict";

import { createElement, dayAndMonthAreCorrect, formatPrice, isInt, redirectNonAdmin, setWarningAfterElement } from "./useful-for-client.js";

const getIssuedOrdersBtn = document.getElementById("get-issued-orders-btn");
const buildChartBtn = document.getElementById("build-chart-btn");
const issuedOrdersContainer = document.getElementById("issued-orders");

redirectNonAdmin(issuedOrdersContainer, null);

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

getIssuedOrdersBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/orders/get-issued-orders", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                orders = result.orders;
            }
        }
    } catch (error) {
        console.error(error.message);
        if (!error.message.includes("Failed to fetch")) {
            alert("Error");
        }
    }
    let everythingIsCorrect = true, message = '';
    for (const dateTimeComponentKey in dateTimeComponents) {
        const dateTimeComponent = dateTimeComponents[dateTimeComponentKey];
        let dateTimeComponentIsUsed = false;
        for (const key in dateTimeComponent) {
            dateTimeComponent[key].style.borderColor = '';
            if (!dateTimeComponentIsUsed && dateTimeComponent[key].value.length > 0) {
                dateTimeComponentIsUsed = true;
                // do not type break in order to dateTimeComponent[key].style.borderColor = '' for all components
            }
        }
        if (!everythingIsCorrect || dateTimeComponentIsUsed === false) {
            continue;
        }
        for (const key in dateTimeComponent) {
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
            // do not type break in order to dateTimeComponent[key].style.borderColor = '' for all components,
            // if (!everythingIsCorrect... above will not allow to set a new message
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
    }
    if (everythingIsCorrect === false) {
        setWarningAfterElement(getIssuedOrdersBtn.parentElement, message);
        return;
    }
    setWarningAfterElement(getIssuedOrdersBtn.parentElement, '');
    renderOrders();
    if (ordersToDisplay.length > 0) {
        issuedOrdersContainer.insertAdjacentHTML('afterbegin', `<section id="income">
        <div>Прибуток за вказаний період: ${formatPrice(ordersToDisplay.reduce((prev, cur) => prev + Number(cur.cost), 0))} грн.</div>
        </section>`);
    }
})
function getTimestamps() {
    let fromTimestamp = dateTimeComponents.from.day.value === '' ?
        0 : Date.parse(new Date(
            Number(dateTimeComponents.from.year.value),
            Number(dateTimeComponents.from.month.value) - 1,
            Number(dateTimeComponents.from.day.value),
            0, 0, 0, 0 // hours, minutes, seconds and milliseconds
        )) || 0;
    let toTimestamp = dateTimeComponents.to.day.value === '' ?
        Date.parse(new Date(9999, 0, 1)) : Date.parse(new Date(
            Number(dateTimeComponents.to.year.value),
            Number(dateTimeComponents.to.month.value) - 1,
            Number(dateTimeComponents.to.day.value),
            23, 59, 59, 999 // hours, minutes, seconds and milliseconds
        )) || Date.parse(new Date(9999, 0, 1));
    return { fromTimestamp, toTimestamp }
}

function renderOrders() {
    let { fromTimestamp, toTimestamp } = getTimestamps();
    if (fromTimestamp > toTimestamp) {
        setWarningAfterElement(getIssuedOrdersBtn.parentElement, 'У діапазоні дат початок більше ніж кінець.');
    } else {
        ordersToDisplay = orders.filter(order => {
            let orderTimestamp = new Date(order.issuance_datetime).setSeconds(0, 0);
            // new Date() adds timezone offset to ISOString
            return orderTimestamp >= fromTimestamp && orderTimestamp <= toTimestamp;
        })
    }
    if (ordersToDisplay.length === 0) {
        issuedOrdersContainer.textContent = "Немає невиданих замовлень у цьому періоді.";
        return;
    }
    issuedOrdersContainer.innerHTML = '';
    ordersToDisplay?.forEach(order => {
        issuedOrdersContainer.append(createOrderElement(order).element);
    })
}
function createOrderElement(order) {
    order.element = createElement({ name: 'div', class: 'order' });
    const orderNum = createElement({ class: 'order_num', content: 'Замовлення №' + order.num });
    order.element.append(orderNum);
    const datetime = createElement({ class: 'datetime', content: 'Дата замовлення: ' + new Date(order.datetime).toLocaleString() });
    order.element.append(datetime);
    const issuanceDatetime = createElement({ class: 'issuance_datetime', content: 'Дата видачі: ' + new Date(order.issuance_datetime).toLocaleString() });
    order.element.append(issuanceDatetime);
    const cost = createElement({ class: 'cost', content: 'Вартість: ' + formatPrice(order.cost) + ' грн.' });
    order.element.append(cost);
    const orderItems = createElement({ class: 'order-items' });
    order.orderItems.forEach(orderItem => {
        let text = orderItem.brand + ' ' + orderItem.model + ' (' + orderItem.amount + ' шт.)';
        orderItems.insertAdjacentHTML("beforeend", `<div class="order-item">${text}</div>`);
    })
    order.element.append(orderItems);
    return order;
}
buildChartBtn.addEventListener('click', async event => {
    event.preventDefault();// don't follow the link
    getIssuedOrdersBtn.click();
    let warningElement = getIssuedOrdersBtn.parentElement.nextElementSibling;
    if (warningElement?.matches('.warning') && warningElement.textContent.length > 0) {
        return;
    }
    try {
        let { fromTimestamp, toTimestamp } = getTimestamps();
        let requestBody = {
            from: new Date(fromTimestamp),
            to: new Date(toTimestamp)
        };
        let response = await fetch(location.origin + "/orders/get-data-for-chart", {
            method: "PROPFIND",
            body: JSON.stringify(requestBody),
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                localStorage.setItem("dataForChart", JSON.stringify(result.dataForChart));
                localStorage.setItem("dateBoundsForChart", `від ${requestBody.from.toLocaleDateString()} до ${requestBody.to.toLocaleDateString()}`);
                buildChartBtn.parentElement.click();// follow the link only now
            }
        }
    } catch (error) {
        event.preventDefault();
        console.error(error.message);
        alert("Error");
    }
});