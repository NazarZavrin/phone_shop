"use strict";

import Customer from "./class_Customer.js";
import { createElement, formatPrice, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

export default class Basket {
    static #storageLabel = "product: ";
    constructor() { }
    setProductInfo(brand, model, price, amount) {
        localStorage.setItem(`${Basket.#storageLabel}${brand}|${model}`, JSON.stringify({
            price: price,
            amount: amount
        }));
        /*console.log("setProductInfo");
        console.log(localStorage);*/
    }
    addProduct(brand, model, price) {
        this.setProductInfo(brand, model, price, 1);
    }
    getProducts() {
        const products = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${Basket.#storageLabel}`)) {
                const info = JSON.parse(localStorage.getItem(key));
                const productModelAndBrand = key.split(Basket.#storageLabel)[1];
                [info.brand, info.model] = productModelAndBrand.split("|");
                products.push(info);
            }
        }
        return products;
    }
    static updateAddToBasketBtn(addToBasketBtn, brand, model, amount = "-1") {
        let disable = false;
        for (const key of Object.keys(localStorage)) {
            if (key.includes(`${this.#storageLabel}${brand}|${model}`)) {
                disable = true;
                break;
            }
        }
        if (Number(amount) === 0) {
            disable = true;
        }
        if (disable) {
            addToBasketBtn.textContent = Number(amount) === 0 ? "Немає в наявності" : "Вже в кошику";
            addToBasketBtn.style.backgroundColor = "dimgray";
            addToBasketBtn.disabled = true;
        } else {
            addToBasketBtn.textContent = "Додати до кошику";
            addToBasketBtn.style.backgroundColor = "";
            addToBasketBtn.disabled = false;
        }
    }
    show(customerNameElem, {
        onRegister = () => {}, onProductDelete = () => {}, 
        onOrderCreated = () => {}, getCurrentProductMainInfo = () => {},
    } = {}) {
        let products = this.getProducts();
        let currentCustomerLabel = null;
        if (localStorage.getItem("customerName") !== null) {
            currentCustomerLabel = createElement({ content: "Покупець: " + localStorage.getItem("customerName") });
            currentCustomerLabel.classList.add("current-customer-label");
        }
        let orderItems = createElement({ name: 'section' });
        const totalCostElem = createElement({ class: 'total-cost' });
        const orderBtn = createElement({ name: 'button', content: "Замовити", class: "order-btn" });
        function updateTotalCost() {
            totalCostElem.textContent = `Сума замовлення: ${formatPrice(products.reduce(
                (totalCost, orderItem) => totalCost + Number.parseFloat(orderItem.price * orderItem.amount), 0))
            } грн.`;
            if (totalCostElem.textContent.includes(": 0 грн")) {
                orderItems.innerHTML = "<p style='padding: 50px'>Кошик пустий</p>";
                totalCostElem.textContent = "";
                orderBtn.style.display = "none";
            } else {
                orderBtn.style.display = "";
            }
        }
        updateTotalCost();
        orderItems.addEventListener('click', event => {
            // change amount
            const amountElem = event.target.closest('.order-item_amount');
            if (amountElem) {
                let orderItemIndex = [...orderItems.querySelectorAll('.order-item_amount')].findIndex(elem => elem === amountElem);
                const orderItem = products[orderItemIndex];
                if (amountElem.innerHTML.length > 0) {
                    const pressedButton = event.target.closest('button');
                    if (pressedButton) {
                        if (pressedButton?.classList?.contains('decrease')) {
                            if (orderItem.amount > 1) {
                                --orderItem.amount;
                            }
                        } else if (pressedButton?.classList?.contains('increase')) {
                            ++orderItem.amount;
                        }
                    }
                }
                amountElem.innerHTML = `<button class="decrease"${orderItem.amount <= 1 ? " disabled" : ""}>-</button>
                <div class="order-item_amount__num">${orderItem.amount}</div>
                <button class="increase">+</button>`;
                orderItem.cost = orderItem.price * orderItem.amount;
                const costElem = amountElem.parentElement.querySelector('.order-item_cost');
                costElem.innerHTML = `<div class='order-item-cost'>${formatPrice(orderItem.cost)} грн.</div>`;
                this.setProductInfo(orderItem.brand, orderItem.model, orderItem.price, orderItem.amount);
                updateTotalCost();
            }
            // deletion from the basket
            const delFromBasketBtn = event.target.closest('.del-from-basket-btn');
            if (!delFromBasketBtn) {
                return;
            }
            let orderItemIndex = [...orderItems.querySelectorAll('.del-from-basket-btn')].findIndex(btn => btn === delFromBasketBtn);
            this.deleteProduct(products[orderItemIndex].brand, products[orderItemIndex].model);
            onProductDelete();// Basket.updateAddToBasketBtn(...)
            products = this.getProducts();
            const orderItemElement = delFromBasketBtn.closest('section > div');
            orderItemElement.remove();
            updateTotalCost();
        });
        products.forEach(orderItem => {
            const modelBrandElem = createElement({ class: 'order-item_model_and_brand', content: `${orderItem.brand + " " + orderItem.model}` });
            const amountElem = createElement({ class: 'order-item_amount' });
            const costElem = createElement({ class: 'order-item_cost' });
            const orderItemElement = createElement();
            orderItemElement.append(modelBrandElem);
            orderItemElement.append(amountElem);
            orderItemElement.append(costElem);
            orderItemElement.insertAdjacentHTML('beforeend', `<button type="button" class="del-from-basket-btn">Видалити з кошику</button>`);
            orderItems.append(orderItemElement);
            amountElem.click();// update amount output
        });
        orderBtn.addEventListener("click", async event => {
            if (localStorage.getItem("customerPhoneNum") !== null) {
                try {
                    if (products.length === 0) {
                        alert("Кошик пустий!");
                        return;
                    }
                    const requestBody = {
                        customerPhoneNum: localStorage.getItem("customerPhoneNum"),
                        orderItems: products
                    };
                    if (getCurrentProductMainInfo()?.brand) {
                        requestBody.currentProductInfo = getCurrentProductMainInfo();
                    }
                    let response = await fetch(location.origin + "/orders/create", {
                        method: "POST",
                        body: JSON.stringify(requestBody),
                        headers: { "Content-Type": "application/json" }
                    })
                    if (response.ok) {
                        let result = await response.json();
                        if (!result.success) {
                            if (result.message.includes("not exist")) {
                                setWarningAfterElement(orderBtn, `Покупця з такими даними не знайдено`);
                                return;
                            }
                            const match = result.message.match(/Only (\d+) phones (.+) are available/);
                            if (match) {
                                setWarningAfterElement(orderBtn, `Кількість смартфонів`
                                + ` ${match[2]} в наявності: ${match[1]}.`
                                + ` Замовлення не оформлено.`);
                                return;
                            }
                            throw new Error(result.message || "Server error.");
                        } else {
                            setWarningAfterElement(orderBtn, `Замовлення оформлено.<br>Номер чеку: ${result.num || -1}.`);                            
                            onOrderCreated(result.newAmount);
                            return;
                        }
                    }
                } catch (error) {
                    console.error(error.message);
                    alert("Error");
                    return;
                }
            } else {
                event.target.closest(".modal-window").closeWindow();
                Customer.showRegistrationWindow(customerNameElem, onRegister);
            }
        });
        showModalWindow([currentCustomerLabel, orderItems,
            totalCostElem, orderBtn],
            { className: 'basket' });
    }
    deleteProduct(brand, model) {
        localStorage.removeItem(`${Basket.#storageLabel}${brand}|${model}`);
    }
    static deleteAllProducts() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${Basket.#storageLabel}`)) {
                console.log(key);
                localStorage.removeItem(key);
                --i;
            }
        }
    }
}