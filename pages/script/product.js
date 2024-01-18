"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";

const customerName = document.getElementById("customer-name");
const accountBtn = document.getElementById("account-btn");
const viewBasketBtn = document.getElementsByClassName("view-basket-btn")[0];
const addToBasketBtn = document.getElementById("add-to-basket-btn");
let splitResult = addToBasketBtn.dataset.product_main_info.split("|");
const productMainInfo = {
    brand: splitResult[0], 
    model: splitResult[1], 
    price: splitResult[2], 
    amount: splitResult[3], 
} 

Basket.updateAddToBasketBtn(addToBasketBtn, productMainInfo.brand, productMainInfo.model, productMainInfo.amount);

if (localStorage.getItem("customerName") === null) {
    customerName.style.display = "none";
} else {
    customerName.textContent = localStorage.getItem("customerName");
}

accountBtn.addEventListener("click", event => {
    if (localStorage.getItem("customerName") === null) {
        Customer.showRegistrationWindow(customerName);
    } else {
        Customer.showCustomerProfile(customerName, {
            onExit: Basket.updateAddToBasketBtn.bind(null, addToBasketBtn, productMainInfo.brand, productMainInfo.model, productMainInfo.amount)
        });
    }
});

const basket = new Basket();
viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName, {
        onProductDelete: () => Basket.updateAddToBasketBtn(addToBasketBtn, productMainInfo.brand, productMainInfo.model),
        onRegister: () => viewBasketBtn.click(),
        getCurrentProductMainInfo: () => { return productMainInfo },
        onOrderCreated: (newAmount) => Basket.updateAddToBasketBtn(addToBasketBtn, productMainInfo.brand, productMainInfo.model, newAmount),
    });
});

addToBasketBtn.addEventListener("click", event => {
    console.log(productMainInfo);
    basket.addProduct(productMainInfo.brand, productMainInfo.model, productMainInfo.price);
    Basket.updateAddToBasketBtn(addToBasketBtn, productMainInfo.brand, productMainInfo.model);
})