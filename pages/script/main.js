"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";

// console.info(``);

const customerName = document.getElementById("customer-name");
const accountBtn = document.getElementById("account-btn");
const viewBasketBtn = document.getElementsByClassName("view-basket-btn")[0];
const brandFilter = document.getElementById("brand-filter");
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
    // view detail info about product
    const productContainer = event.target.closest("section.product");
    if (!productContainer) {
        return;
    }
    const productInfo = productContainer.querySelector(".product_main_info")?.dataset.product_main_info || "";
    if (productInfo) {
        location.href = location.origin + "/products/" + encodeURIComponent(productInfo);
    }
})

viewBasketBtn.addEventListener('click', event => {
    basket.show(customerName);
});

brandFilter.addEventListener('change', event => {
    // console.dir(brandFilter);
    // console.log(brandFilter.value);
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