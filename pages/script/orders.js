"use strict";

import Orders from "./class_Order.js";
import { isInt, setWarningAfterElement } from "./useful-for-client.js";

const searchBtn = document.getElementById("search-btn");
const refreshBtn = document.getElementById("refresh-btn");
const ordersContainer = document.getElementById("orders");

const searchInputsContainer = document.getElementsByClassName('search-inputs')[0];
let searchInputs = {};
for (const input of searchInputsContainer.querySelectorAll('input')) {
    searchInputs[input.getAttribute('name')] = input;
}

let orders = new Orders();

refreshBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/orders/get-orders", {
            method: "PROPFIND",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                // console.log(...result.orders);
                orders = new Orders(result.orders);
                searchBtn.click();
            }
        }
    } catch (error) {
        console.error(error.message);
        alert("Error");
    }
})

refreshBtn.click();

searchBtn.addEventListener('click', event => {
    let everythingIsCorrect = true, message = '';
    if (searchInputs.num.value.length > 0 && isInt(searchInputs.num.value).length > 0) {
        message = 'Номер чеку повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    }
    if (searchInputs.customer_phone_num.value.length > 0 && isInt(searchInputs.customer_phone_num.value).length > 0) {
        message = 'Номер телефону покупця повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    }
    if (everythingIsCorrect === false) {
        setWarningAfterElement(searchBtn, message);
        return;
    }
    setWarningAfterElement(searchBtn, '');
    orders.filterAndRenderOrders(ordersContainer, searchInputs);
})
ordersContainer.addEventListener('click', event => {
    // 1: order deletion logic, 2: order issuance logic
    // 1: order deletion logic
    const deleteOrderBtn = event.target.closest('.delete-order-btn');
    if (deleteOrderBtn) {
        try {
            let orderIndex = [...ordersContainer.querySelectorAll('.delete-order-btn')].findIndex(btn => btn === deleteOrderBtn);
            orders.deleteOrder(orderIndex);
            const orderElement = deleteOrderBtn.closest(".order");
            if (orderElement) {
                orderElement.remove();
            }
            refreshBtn.click();
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
    orders.issueOrder(orderIndex);
})