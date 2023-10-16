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
    name: splitResult[1], 
    price: splitResult[2], 
    amount: splitResult[3], 
} 

const basket = new Basket();
if (localStorage.getItem("customerName") === null) {
    customerName.style.display = "none";
} else {
    customerName.textContent = localStorage.getItem("customerName");
}

Basket.updateAddToBasketBtn(productMainInfo.brand, productMainInfo.name, addToBasketBtn, productMainInfo.amount);

accountBtn.addEventListener("click", event => {
    if (localStorage.getItem("customerName") === null) {
        Customer.showRegistrationWindow(customerName);
    } else {
        Customer.showCustomerProfile(customerName, {
            onExit: Basket.updateAddToBasketBtn.bind(null, productMainInfo.brand, productMainInfo.name, addToBasketBtn, productMainInfo.amount)
        });
    }
});
// Basket.updateAddToBasketBtn(productMainInfo.brand, productMainInfo.name, addToBasketBtn, productMainInfo.amount);

viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName, {
        onProductDelete: () => Basket.updateAddToBasketBtn(productMainInfo.brand, productMainInfo.name, addToBasketBtn), 
        onRegister: () => viewBasketBtn.click(),
        getCurrentProductMainInfo: () => { return  productMainInfo },
        onOrderCreated: (newAmount) => Basket.updateAddToBasketBtn(productMainInfo.brand, productMainInfo.name, addToBasketBtn, newAmount),
    });
});

addToBasketBtn.addEventListener("click", event => {
    basket.addProduct(productMainInfo.brand, productMainInfo.name, productMainInfo.price);
    Basket.updateAddToBasketBtn(productMainInfo.brand, productMainInfo.name, addToBasketBtn);
    console.log(basket.getProducts());
})