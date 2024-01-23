"use strict";

import { createElement, dayAndMonthAreCorrect, isInt, setWarningAfterElement } from "./useful-for-client.js";

const getIssuedOrdersBtn = document.getElementById("get-issued-orders-btn");
const issuedOrdersContainer = document.getElementById("issued-orders");

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
let ordersReceived = false;

(async () => {
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
                console.log(result.orders);
                orders = result.orders;
                ordersReceived = true;
            }
        }
    } catch (error) {
        console.error(error.message);
        alert("Error");
    }
})();

getIssuedOrdersBtn.addEventListener('click', event => {
    if (!ordersReceived) {
        alert("Замовлення не завантажені. Спробуйте пізніше чи оновіть сторінку.");
        return;
    }
    let everythingIsCorrect = true, message = '';
    for (const dateTimeComponentKey in dateTimeComponents) {
        const dateTimeComponent = dateTimeComponents[dateTimeComponentKey];
        let dateTimeComponentIsUsed = false;
        for (const key in dateTimeComponent) {
            dateTimeComponent[key].style.borderColor = '';
            if (!dateTimeComponentIsUsed && dateTimeComponent[key].value.length > 0) {
                dateTimeComponentIsUsed = true;
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
        setWarningAfterElement(getIssuedOrdersBtn, message);
        return;
    }
    setWarningAfterElement(getIssuedOrdersBtn, '');
    renderOrders();
    if (ordersToDisplay.length > 0) {
        issuedOrdersContainer.insertAdjacentHTML('afterbegin', `<section id="general-info">
        <div>Кількість проданих товарів: ${ordersToDisplay.reduce((prev, cur) => prev + cur.orderItems.length, 0)}</div>
        <div>Загальна вартість: ${ordersToDisplay.reduce((prev, cur) => prev + Number(cur.cost), 0)}</div>
        </section>`);
    }
})
function renderOrders() {
    let fromTimestamp = dateTimeComponents.from.day.value === '' ?
        0 : Date.parse(new Date(
            Number(dateTimeComponents.from.year.value),
            Number(dateTimeComponents.from.month.value) - 1,
            Number(dateTimeComponents.from.day.value),
            0, 0, 0, 0 // hours, minutes, seconds and milliseconds
        )) || 0;
    let toTimestamp = dateTimeComponents.to.day.value === '' ?
        Infinity : Date.parse(new Date(
            Number(dateTimeComponents.to.year.value),
            Number(dateTimeComponents.to.month.value) - 1,
            Number(dateTimeComponents.to.day.value),
            23, 59, 59, 999 // hours, minutes, seconds and milliseconds
        )) || Infinity;
    if (fromTimestamp > toTimestamp) {
        setWarningAfterElement(getIssuedOrdersBtn, 'У діапазоні дат початок більше ніж кінець.');
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
    const cost = createElement({ class: 'cost', content: 'Вартість: ' + order.cost + ' грн.' });
    order.element.append(cost);
    const orderItems = createElement({ class: 'order-items' });
    order.orderItems.forEach(orderItem => {
        let text = orderItem.brand + ' ' + orderItem.model + ' (' + orderItem.amount + ' шт.)';
        orderItems.insertAdjacentHTML("beforeend", `<div class="order-item">${text}</div>`);
    })
    order.element.append(orderItems);
    return order;
}