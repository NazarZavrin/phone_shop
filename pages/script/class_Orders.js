"use strict";

import { createElement, setWarningAfterElement, showModalWindow, isFloat } from "./useful-for-client.js";

export default class Orders {
    #orders
    #ordersToDisplay
    constructor(ordersArray = []) {
        this.#orders = ordersArray;
    }
    filterAndRenderOrders(ordersContainer, searchInputs, dateTimeComponents, searchBtn) {
        if (!this.#orders || this.#orders.length === 0) {
            ordersContainer.textContent = "Невидані замовлення відсутні.";
            return;
        }
        this.#ordersToDisplay = this.#orders.filter(order => order.num.includes(searchInputs.num.value))
            .filter(order => order.customer_phone_num.includes(searchInputs.customer_phone_num.value));
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
            setWarningAfterElement(searchBtn, 'У діапазоні дат початок більше ніж кінець.');
            return;
        } else {
            this.#ordersToDisplay = this.#ordersToDisplay.filter(order => {
                let orderTimestamp = new Date(order.datetime).setSeconds(0, 0);
                // new Date() adds timezone offset to ISOString
                return orderTimestamp >= fromTimestamp && orderTimestamp <= toTimestamp;
            })
        }
        if (this.#ordersToDisplay.length === 0) {
            ordersContainer.textContent = "Немає невиданих замовлень, що задовільняють фільтри.";
            return;
        }
        ordersContainer.innerHTML = '';
        this.#ordersToDisplay?.forEach(order => {
            ordersContainer.append(Orders.createOrderElement(order).element);
        });
    }
    static createOrderElement(order) {
        order.element = createElement({ name: 'section', class: 'order' });
        const orderNum = createElement({ class: 'order_num', content: 'Замовлення №' + order.num });
        order.element.append(orderNum);
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
            let text = orderItem.brand + ' ' + orderItem.model + ' (' + orderItem.amount + ' шт.)';
            orderItems.insertAdjacentHTML("beforeend", `<div class="order-item">${text}</div>`);
        })
        order.element.append(orderItems);
        const issuanceBtn = createElement({ name: 'button', class: 'issuance-btn', content: 'Видати замовлення' });
        order.element.append(issuanceBtn);
        const deleteOrderBtn = createElement({ name: 'button', class: 'delete-order-btn', content: 'Видалити замовлення' });
        order.element.append(deleteOrderBtn);
        if (localStorage.getItem("employeeName") !== 'Admin') {
            deleteOrderBtn.style.display = "none";
        }
        return order;
    }
    async deleteOrder(orderIndex) {
        let requestBody = {
            num: this.#ordersToDisplay[orderIndex].num
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
            }
        }
    }
    async issueOrder(orderIndex, {onComplete = () => {}}) {
        const header = createElement({ name: "header", content: 'Видача замовлення №' + this.#ordersToDisplay[orderIndex].num });
        const сostElem = createElement({ class: 'cost', content: 'Вартість: ' + this.#ordersToDisplay[orderIndex].cost + ' грн.' });
        const paidLabel = createElement({ name: "header", content: "Заплачено (грн.):" });
        const paidInput = createElement({ name: "input" });
        paidInput.setAttribute("autocomplete", "off");
        const changeLabel = createElement({ name: "header" });
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
            let change = Number(paidInput.value.split(",").join(".")) - this.#ordersToDisplay[orderIndex].cost;
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
                        num: this.#ordersToDisplay[orderIndex].num,
                        employeePhoneNum: localStorage.getItem("employeePhoneNum"),
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
                            onComplete(requestBody.num);
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
    }
}