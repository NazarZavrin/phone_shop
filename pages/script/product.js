"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";

const customerName = document.getElementById("customer-name");
const accountBtn = document.getElementById("account-btn");
const viewBasketBtn = document.getElementsByClassName("view-basket-btn")[0];
const content = document.querySelector(".wrapper > main");
const addToBasketBtn = document.getElementById("add-to-basket-btn");
const productMainInfo = addToBasketBtn.dataset.product_main_info.split("|");

const basket = new Basket();
if (localStorage.getItem("customerName") === null) {
    customerName.style.display = "none";
} else {
    customerName.textContent = localStorage.getItem("customerName");
}

Basket.updateAddToBasketBtn(productMainInfo[0], productMainInfo[1], addToBasketBtn);

accountBtn.addEventListener("click", event => {
    if (localStorage.getItem("customerName") === null) {
        Customer.showRegistrationWindow(customerName);
    } else {
        Customer.showCustomerProfile(customerName, {
            onExit: Basket.updateAddToBasketBtn.bind(null, productMainInfo[0], productMainInfo[1], addToBasketBtn)
        });
    }
});

viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName, {
        addToBasketBtn: addToBasketBtn, 
        viewBasketBtn: viewBasketBtn
    });
});

addToBasketBtn.addEventListener("click", event => {
    basket.addProduct(...productMainInfo);
    Basket.updateAddToBasketBtn(productMainInfo[0], productMainInfo[1], addToBasketBtn);
    console.log(basket.getProducts());
})