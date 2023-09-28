"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";
import { createElement, setWarningAfterElement, showModalWindow } from "./useful-for-client.js";

// console.info(``);

const customerName = document.getElementById("customer-name");
const accountBtn = document.getElementById("account-btn");
const viewBasketBtn = document.getElementsByClassName("view-basket-btn")[0];
const content = document.querySelector(".wrapper > main");

const basket = new Basket();
if (localStorage.getItem("customerName") === null) {
    customerName.style.display = "none";
} else {
    customerName.textContent = localStorage.getItem("customerName");
}
accountBtn.addEventListener("click", event => {
    if (localStorage.getItem("customerName") === null) {
        Customer.showRegistrationWindow(customerName);
    } else {
        Customer.showCustomerProfile(customerName);
    }
});

content.addEventListener("click", async event => {
    // view detail info about phone
    const phoneContainer = event.target.closest("section.phone");
    if (!phoneContainer) {
        return;
    }
    const productInfo = phoneContainer.querySelector(".phone_main_info")?.dataset.phone_main_info || "";
    if (productInfo) {
        location.href = location.origin + "/products/" + encodeURIComponent(productInfo);
    }
})

viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName);
});