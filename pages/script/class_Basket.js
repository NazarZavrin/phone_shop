"use strict";

import Customer from "./class_Customer.js";
import { createElement, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

export default class Basket {
    static #storageLabel = "product: ";
    constructor() { }
    setProductInfo(brand, name, price, amount) {
        localStorage.setItem(`${Basket.#storageLabel}${brand}|${name}`, JSON.stringify({
            price: price,
            amount: amount
        }));
    }
    addProduct(brand, name, price) {
        this.setProductInfo(brand, name, price, 1);
    }
    getProducts() {
        const products = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${Basket.#storageLabel}`)) {
                const info = JSON.parse(localStorage.getItem(key));
                const productNameAndBrand = key.split(Basket.#storageLabel)[1];
                [info.brand, info.name] = productNameAndBrand.split("|");
                products.push(info);
            }
        }
        return products;
    }
    static updateAddToBasketBtn(brand, name, addToBasketBtn) {

        let contains = false;
        for (const key of Object.keys(localStorage)) {
            // console.log(key);
            // console.log(`${this.#storageLabel}${brand}|${name}`);
            if (key.includes(`${this.#storageLabel}${brand}|${name}`)) {
                contains = true;
                break;
            }
        }
        console.log(arguments, contains);
        if (contains) {
            addToBasketBtn.textContent = "Вже в кошику";
            addToBasketBtn.style.backgroundColor = "dimgray";
        } else {
            addToBasketBtn.textContent = "Додати до кошику";
            addToBasketBtn.style.backgroundColor = "";
        }
    }
    show(customerNameElem, {addToBasketBtn = {}, viewBasketBtn = {}}) {
        let products = this.getProducts();
        // console.log(...products);
        let currentCustomerLabel = null;
        if (localStorage.getItem("customerName") !== null) {
            currentCustomerLabel = createElement({ content: "Покупець: " + localStorage.getItem("customerName") });
            currentCustomerLabel.classList.add("current-customer-label");
        }
        let orderItems = createElement({ name: 'section' });
        const totalCostElem = createElement({ class: 'total-cost' });
        const orderBtn = createElement({ name: 'button', content: "Замовити", class: "order-btn" });
        function updateTotalCost() {
            // console.log(...products);
            totalCostElem.textContent = `Сума замовлення: ${products.reduce(
                (totalCost, orderItem) => totalCost + Number.parseFloat(orderItem.price * orderItem.amount), 0)
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
                // console.log(orderItem.cost);
                const costElem = amountElem.parentElement.querySelector('.order-item_cost');
                costElem.innerHTML = `<div class='order-item-cost'>${orderItem.cost} грн.</div>`;
                this.setProductInfo(orderItem.brand, orderItem.name, orderItem.price, orderItem.amount);
                updateTotalCost();
            }

            // deletion from the basket
            const delFromBasketBtn = event.target.closest('.del-from-basket-btn');
            if (!delFromBasketBtn) {
                return;
            }
            let orderItemIndex = [...orderItems.querySelectorAll('.del-from-basket-btn')].findIndex(btn => btn === delFromBasketBtn);
            // console.log(products);
            this.deleteProduct(products[orderItemIndex].brand, products[orderItemIndex].name);

            // console.log(products);
            Basket.updateAddToBasketBtn(products[orderItemIndex]?.brand, products[orderItemIndex]?.name, addToBasketBtn);
            products = this.getProducts();
            const orderItemElement = delFromBasketBtn.closest('section > div');
            orderItemElement.remove();
            updateTotalCost();
        });
        products.forEach(orderItem => {
            const nameBrandElem = createElement({ class: 'order-item_name_and_brand', content: `${orderItem.brand + " " + orderItem.name}` });
            const amountElem = createElement({ class: 'order-item_amount' });
            const costElem = createElement({ class: 'order-item_cost' });
            // console.log(amountElem);
            const orderItemElement = createElement();
            orderItemElement.append(nameBrandElem);
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
                    let response = await fetch(location.origin + "/orders/create-order", {
                        method: "POST",
                        body: JSON.stringify(requestBody),
                        headers: { "Content-Type": "application/json" }
                    })
                    if (response.ok) {
                        let result = await response.json();
                        console.log(result);
                        if (!result.success) {
                            throw new Error(result.message || "Server error.");
                        } else {
                            setWarningAfterElement(orderBtn, `Замовлення оформлено. Номер чеку: ${result.num || -1}.`);
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
                Customer.showRegistrationWindow(customerNameElem, () => viewBasketBtn.click());
            }
        });
        showModalWindow([currentCustomerLabel, orderItems,
            totalCostElem, orderBtn],
            { className: 'basket' });
    }
    deleteProduct(brand, name) {
        localStorage.removeItem(`${Basket.#storageLabel}${brand}|${name}`);
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