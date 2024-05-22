"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";

const customerName = document.getElementById("customer-name");
const accountBtn = document.getElementById("account-btn");
const viewBasketBtn = document.getElementsByClassName("view-basket-btn")[0];
const brandFilter = document.getElementById("brand-filter");
const content = document.querySelector(".wrapper > main");

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
    // view detailed information about the product
    const productContainer = event.target.closest("section.product");
    if (!productContainer) {
        return;
    }
    const productInfo = productContainer.querySelector(".product_main_info")?.dataset.product_main_info || "";
    if (productInfo) {
        location.href = location.origin + "/products/" + encodeURIComponent(productInfo);
    }
})

const basket = new Basket();
viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName, {
        onRegister: () => viewBasketBtn.click(),
    });
});

brandFilter.addEventListener('change', event => {
    let brandForFilter = brandFilter.value;
    if (brandForFilter === "none") {
        brandForFilter = "";
    }
    let productContainers = document.querySelectorAll("main > section.product");
    for (const productContainer of productContainers) {
        const productInfo = productContainer.querySelector(".product_main_info")?.dataset.product_main_info || "";
        productContainer.style.display = productInfo.includes(brandForFilter) ? "" : "none";
    }
})