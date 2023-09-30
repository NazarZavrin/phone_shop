"use strict";

import Basket from "./class_Basket.js";
import { createElement, emailIsCorrect, phoneNumberIsCorrect, setWarningAfterElement, showModalWindow, nameIsCorrect, showPassword, passwordIsCorrect } from "./useful-for-client.js";

export default class Customer {
    constructor(callback = function () { }) {
        const header = createElement({ name: "header", content: "Створення акаунту" });
        const nameLabel = createElement({ name: "header", content: "Введіть ваше ім'я:" });
        const nameInput = createElement({ name: "input" });
        nameInput.setAttribute("autocomplete", "off");
        const phoneNumberLabel = createElement({ name: "header", content: "Введіть ваш номер телефону:" });
        const phoneNumberInput = createElement({ name: "input" });
        phoneNumberInput.setAttribute("autocomplete", "off");
        phoneNumberInput.setAttribute("type", "tel");
        const emailLabel = createElement({ name: "header", content: "Введіть ваш email:" });
        const emailInput = createElement({ name: "input" });
        emailInput.setAttribute("autocomplete", "off");
        const passwordLabel = createElement({ name: "header", content: "Придумайте пароль:" });
        const passwordInput = createElement({ name: "input", attributes: ["type: password", "autocomplete: off"] });
        const passwordBlock = createElement({ name: "form", class: "password-block" });
        passwordBlock.innerHTML = `<label class="show-password">
    <input type="checkbox">Показати пароль</label>`;
        passwordBlock.prepend(passwordInput);
        passwordBlock.addEventListener("change", showPassword);
        const createAccountBtn = createElement({ name: 'button', content: "Створити акаунт", class: "create-account-btn" });
        createAccountBtn.addEventListener("click", async event => {
            setWarningAfterElement(createAccountBtn, '');
            let everythingIsCorrect = nameIsCorrect(nameInput);
            everythingIsCorrect = phoneNumberIsCorrect(phoneNumberInput) && everythingIsCorrect;
            everythingIsCorrect = emailIsCorrect(emailInput) && everythingIsCorrect;
            everythingIsCorrect = passwordIsCorrect(passwordInput) && everythingIsCorrect;
            if (!everythingIsCorrect) {
                return;
            }
            try {
                let requestBody = {
                    name: nameInput.value,
                    phoneNum: phoneNumberInput.value,
                    email: emailInput.value,
                    password: passwordInput.value
                };
                let response = await fetch(location.origin + "/customers/create-account", {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("phone number already exists")) {
                            setWarningAfterElement(createAccountBtn, 'Покупець з таким номером телефону вже існує');
                            return;
                        }
                        throw new Error(result.message || "Server error.");
                    } else {
                        event.target.closest(".modal-window").closeWindow();
                        callback(result.customerData.name, result.customerData.phone_num);
                    }
                }
            } catch (error) {
                console.error(error.message);
                alert("Error");
                return;
            }
        });
        showModalWindow([header, nameLabel, nameInput,
            phoneNumberLabel, phoneNumberInput,
            emailLabel, emailInput,
            passwordLabel, passwordBlock,
            createAccountBtn],
            { className: 'create-account' });
    }
    static showRegistrationWindow(customerNameElem, callback = function () { }) {
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
            // for login you must enter phone number and password
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
                let response = await fetch(location.origin + "/customers/log-in", {
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
                        customerNameElem.textContent = result.customerData.name;
                        customerNameElem.style.display = "";
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
                customerNameElem.textContent = createdCustomerName;
                customerNameElem.style.display = "";
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
    static showCustomerProfile(customerNameElem, {onExit = function () { }}) {
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
                                setWarningAfterElement(changePasswordBtn, `Помилка: знайдено декілька покупців з таким номером телефону.`);
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
            customerNameElem.style.display = "none";
            localStorage.removeItem("customerName");
            localStorage.removeItem("customerPhoneNum");
            Basket.deleteAllProducts();
            onExit();
            event.target.closest(".modal-window").closeWindow();
        });
        showModalWindow([customerInfo, changePasswordBtn,
            exitBtn],
            { className: 'profile' });
    }
}
