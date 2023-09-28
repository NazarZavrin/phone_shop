"use strict";

import { createElement, emailIsCorrect, phoneNumberIsCorrect, setWarningAfterElement, showModalWindow, nameIsCorrect, showPassword, passwordIsCorrect } from "./useful-for-client.js";

export default class Orders {
    #orders
    #ordersToDisplay
    constructor(ordersArray = []) {
        this.#orders = ordersArray;
    }
    renderOrders(ordersContainer) {
        if (!this.#orders || this.#orders.length === 0) {
            ordersContainer.textContent = "Невидані замовлення відсутні.";
            return;
        }
        // console.log(orders[0]);
        // console.log(orders.length);
        this.#ordersToDisplay = this.#orders.filter(order => order.num.includes(searchInputs.num.value))
            .filter(order => order.customer_phone_num.includes(searchInputs.customer_phone_num.value));

        if (this.#ordersToDisplay.length === 0) {
            ordersContainer.textContent = "Немає невиданих замовлень, що задовільняють фільтри.";
            return;
        }
        ordersContainer.innerHTML = '';
        this.#ordersToDisplay?.forEach(order => {
            ordersContainer.append(order.element || this.constructor.createOrderElement(order).element);
        })
    }
    static createOrderElement(order) {
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
            let text = `Піца: ${orderItem.pizza}; `;
            if (orderItem.extra_toppings.length > 0) {
                text += `добавки: ${orderItem.extra_toppings.join(", ")}.`;
            } else {
                text += `добавки відсутні.`;
            }
            orderItems.insertAdjacentHTML("beforeend", `<div class="order-item">${text[0] + text.slice(1).toLocaleLowerCase()}</div>`);
        })
        order.element.append(orderItems);
        const issuanceBtn = createElement({ name: 'button', class: 'issuance-btn', content: 'Видати замовлення' });
        order.element.append(issuanceBtn);
        const deleteOrderBtn = createElement({ name: 'button', class: 'delete-order-btn', content: 'Видалити замовлення' });
        if (localStorage.getItem("employeeName") === 'Admin') {
            deleteOrderBtn.style.display = 'block';
        }
        order.element.append(deleteOrderBtn);
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
    async issueOrder(orderIndex) {
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
                        num: ordersToDisplay[orderIndex].num,
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
                            receiptLink.href = location.href + `/${requestBody.num}`;
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
    }
}