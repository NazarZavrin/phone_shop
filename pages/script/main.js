"use strict";

import Basket from "./class_Basket.js";
import Customer from "./class_Customer.js";
import { createElement, passwordIsCorrect, setWarningAfterElement, showModalWindow, showPassword } from "./useful-for-client.js";

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
        showRegistrationWindow();
    } else {
        showCustomerProfile();
    }
});

content.addEventListener("click", async event => {
    // view detail info about phone
    const phoneContainer = event.target.closest("section.phone");
    if (!phoneContainer) {
        return;
    }
    const phoneName = phoneContainer.querySelector(".phone__name")?.dataset.phone_name || "";
    if (phoneName) {
        location.href = location.href + "/products/" + phoneName;
    }
})

viewBasketBtn.addEventListener('click', event => {
    let products = basket.getProducts();
    console.log(...products);

    let currentCustomerLabel = null;
    if (localStorage.getItem("customerName") !== null) {
        currentCustomerLabel = createElement({ content: "Покупець: " + localStorage.getItem("customerName") });
        currentCustomerLabel.classList.add("current-customer-label");
    }
    let orderItems = createElement({ name: 'section' });
    products.forEach(orderItem => {
        const nameBrandElem = createElement({ class: 'phone-name-brand', content: `${orderItem.brand + orderItem.name}` });
        const priceElem = createElement({ class: 'phone-price', content: `${orderItem.price}` });
        const amountElem = createElement({ class: 'phone-amount', content: `${orderItem.amount}` });
        const orderItemElement = createElement();
        orderItemElement.append(nameBrandElem);
        orderItemElement.append(priceElem);
        orderItemElement.append(amountElem);
        orderItemElement.insertAdjacentHTML('beforeend', `<div class='phone-cost'>${orderItem.cost}</div>
        <button type="button" class="del-from-basket-btn">Видалити з кошику</button>`);
        orderItems.append(orderItemElement);
    });
    const totalCostElem = createElement({ class: 'total-cost' });
    const orderBtn = createElement({ name: 'button', content: "Замовити", class: "order-btn" });
    function updateTotalCost() {
        totalCostElem.textContent = `Сума замовлення: ${products.reduce(
            (totalCost, orderItem) => totalCost + Number.parseFloat(orderItem.cost), 0)
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
        // deletion from the basket
        const delFromBasketBtn = event.target.closest('.del-from-basket-btn');
        if (!delFromBasketBtn) {
            return;
        }
        let orderItemIndex = [...orderItems.querySelectorAll('.del-from-basket-btn')].findIndex(btn => btn === delFromBasketBtn);
        console.log(products);
        basket.deleteProduct(products[orderItemIndex].name);
        // products = basket.getProducts();
        console.log(products);
        const orderItemElement = delFromBasketBtn.closest('section > div');
        orderItemElement.remove();
        updateTotalCost();
    })
    orderBtn.addEventListener("click", async event => {
        if (localStorage.getItem("customerName") !== null) {
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
                        setWarningAfterElement(orderBtn, `Замовлення оформлено. Номер чеку: ${result.receiptNum || -1}.`);
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
            showRegistrationWindow(() => viewBasketBtn.click());
        }
    });
    showModalWindow([currentCustomerLabel, orderItems,
        totalCostElem, orderBtn],
        { className: 'basket' });
})

function showRegistrationWindow(callback = function () { }) {
    const phoneNumLabel = createElement({ name: "header", content: "Введіть ваш номер телефону:" });
    const phoneNumInput = createElement({ name: "input", attributes: ["type: tel", "autocomplete: off"] });
    const passwordLabel = createElement({ name: "header", content: "Введіть пароль:" });
    const passwordInput = createElement({ name: "input", attributes: ["type: password", "autocomplete: off"] });
    const passwordBlock = createElement({ name: "form", class: "password-block" });
    passwordBlock.innerHTML = `<label class="show-password">
    <input type="checkbox">Показати пароль</label>`;
    passwordBlock.prepend(passwordInput);
    passwordBlock.addEventListener("change", showPassword);
    const logInBtn = createElement({ name: 'button', content: "Увійти", class: "log-in-btn" });
    logInBtn.addEventListener("click", async event => {
        setWarningAfterElement(phoneNumInput, '');
        setWarningAfterElement(passwordInput, '');
        setWarningAfterElement(logInBtn, '');
        // for login you can enter name or phone or both, and password
        let everythingIsCorrect = phoneNumberIsCorrect(phoneNumInput);
        if (passwordInput.value.length === 0) {
            setWarningAfterElement(passwordInput, 'Введіть пароль');
            everythingIsCorrect = false;
        }
        if (everythingIsCorrect === false) {
            return;
        }
        try {
            let requestBody = {
                phoneNum: phoneNumInput.value,
                password: passwordInput.value
            };
            let response = await fetch(location.origin + "/customer/log-in", {
                method: "PROPFIND",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
                if (!result.success) {
                    if (result.message.includes("not exist")) {
                        setWarningAfterElement(logInBtn, `Покупця з такими даними не існує`);
                        return;
                    }
                    if (result.message.includes("several customers")) {
                        setWarningAfterElement(logInBtn, `Помилка: знайдено декілька покупців з таким номером телефону.`);
                        return;
                    }
                    if (result.message.includes("Wrong password")) {
                        setWarningAfterElement(logInBtn, `Неправильний пароль`);
                        return;
                    }
                    throw new Error(result.message || "Server error.");
                } else {
                    customerName.textContent = result.customerData.name;
                    customerName.style.display = "";
                    localStorage.setItem("customerName", result.customerData.name);
                    localStorage.setItem("customerPhoneNum", result.customerData.phone_num);
                }
            }
        } catch (error) {
            console.error(error.message);
            alert("Error");
            return;
        }
        event.target.closest(".modal-window").closeWindow();
        callback();
    });
    const createAccountBtn = createElement({ name: 'button', content: "Створити акаунт", class: "create-account-btn" });
    createAccountBtn.addEventListener("click", event => {
        event.target.closest(".modal-window").closeWindow();
        new Customer((createdCustomerName, createdCustomerPhoneNum) => {
            customerName.textContent = createdCustomerName;
            customerName.style.display = "";
            localStorage.setItem("customerName", createdCustomerName);
            localStorage.setItem("customerPhoneNum", createdCustomerPhoneNum);
            callback();
        });
    });
    showModalWindow([phoneNumLabel, phoneNumInput,
        passwordLabel, passwordBlock,
        logInBtn, createAccountBtn],
        { className: 'registration' });
}
function showCustomerProfile() {
    const customerInfo = createElement({ name: 'section', class: 'info' });
    customerInfo.innerHTML = `<div>${localStorage.getItem("customerName")}</div>
        <div>${localStorage.getItem("customerPhoneNum")}</div>`;
    const oldPasswordLabel = createElement({ name: "label", content: "Введіть старий пароль:" },);
    const oldPasswordInput = createElement({ name: "input", attributes: ["type: password", "autocomplete: off"] });
    const oldPasswordBlock = createElement({ name: "form", class: "password-block" });
    oldPasswordBlock.innerHTML = `<label class="show-password">
    <input type="checkbox">Показати пароль</label>`;
    oldPasswordBlock.prepend(oldPasswordInput);
    oldPasswordBlock.addEventListener("change", showPassword);
    const newPasswordLabel = createElement({ name: "label", content: "Введіть новий пароль:" },);
    const newPasswordInput = createElement({ name: "input", attributes: ["type: password", "autocomplete: off"] });
    const newPasswordBlock = createElement({ name: "form", class: "password-block" });
    newPasswordBlock.innerHTML = `<label class="show-password">
    <input type="checkbox">Показати пароль</label>`;
    newPasswordBlock.prepend(newPasswordInput);
    newPasswordBlock.addEventListener("change", showPassword);
    const changePasswordBtn = createElement({ name: 'button', content: "Змінити пароль", class: "change-password-btn", style: "background-color: royalblue" });
    changePasswordBtn.addEventListener("click", async event => {
        if (!changePasswordBtn.textContent.includes("Підтвердити")) {
            // display necessary labels and inputs
            [oldPasswordLabel, oldPasswordBlock, newPasswordLabel, newPasswordBlock].forEach(element => changePasswordBtn.before(element));
            changePasswordBtn.textContent = "Підтвердити зміну пароля";
        } else {
            setWarningAfterElement(oldPasswordInput, '');
            setWarningAfterElement(changePasswordBtn, '');
            let everythingIsCorrect = true;
            if (oldPasswordInput.value.length === 0) {
                setWarningAfterElement(oldPasswordInput, 'Введіть старий пароль');
                everythingIsCorrect = false;
            }
            everythingIsCorrect = passwordIsCorrect(newPasswordInput) && everythingIsCorrect;
            if (!everythingIsCorrect) {
                return;
            }
            try {
                let requestBody = {
                    customerPhoneNum: localStorage.getItem("customerPhoneNum"),
                    oldPassword: oldPasswordInput.value,
                    newPassword: newPasswordInput.value,
                };
                let response = await fetch(location.origin + "/customers/change-password", {
                    method: "PATCH",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("does not exist")) {
                            setWarningAfterElement(changePasswordBtn, `Покупця з такими даними не існує`);
                            return;
                        }
                        if (result.message.includes("several customers")) {
                            setWarningAfterElement(logInBtn, `Помилка: знайдено декілька покупців з таким номером телефону.`);
                            return;
                        }
                        if (result.message.includes("Wrong password")) {
                            setWarningAfterElement(changePasswordBtn, `Неправильний старий пароль`);
                            return;
                        }
                        throw new Error(result.message || "Server error.");
                    } else {
                        event.target.closest(".modal-window").closeWindow();
                    }
                }
            } catch (error) {
                console.error(error.message);
                alert("Error");
                return;
            }
        }
    });
    const exitBtn = createElement({ name: 'button', class: 'exit-btn', content: 'Вийти' });
    exitBtn.addEventListener('click', event => {
        customerName.style.display = "none";
        localStorage.removeItem("customerName");
        localStorage.removeItem("customerPhoneNum");
        event.target.closest(".modal-window").closeWindow();
        // showRegistrationWindow();
    });
    showModalWindow([customerInfo, changePasswordBtn,
        exitBtn],
        { className: 'profile' });
}