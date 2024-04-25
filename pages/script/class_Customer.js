"use strict";

import Basket from "./class_Basket.js";
import { createElement, emailIsCorrect, phoneNumberIsCorrect, setWarningAfterElement, showModalWindow, nameIsCorrect, showPassword, passwordIsCorrect } from "./useful-for-client.js";

export default class Customer {
    constructor(callback = function () { }, { creator = "customer" }) {
        const header = createElement({ name: "header", content: `Створення акаунту${creator === "customer" ? "" : " покупця"}` });
        const nameLabel = createElement({ name: "header", content: `Введіть ${creator === "customer" ? "ваше ім'я" : "ім'я покупця"}:` });
        const nameInput = createElement({ name: "input" });
        nameInput.setAttribute("autocomplete", "off");
        const phoneNumberLabel = createElement({ name: "header", content: `Введіть ${creator === "customer" ? "ваш номер телефону" : "номер телефону покупця"}:` });
        const phoneNumberInput = createElement({ name: "input" });
        phoneNumberInput.setAttribute("autocomplete", "off");
        phoneNumberInput.setAttribute("type", "tel");
        const emailLabel = createElement({ name: "header", content: `Введіть ${creator === "customer" ? "ваш email" : "email покупця"}:` });
        const emailInput = createElement({ name: "input" });
        emailInput.setAttribute("autocomplete", "off");
        const passwordLabel = createElement({ name: "header", content: creator === "customer" ? "Придумайте пароль:" : "Введіть пароль покупця" });
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
            /*setWarningAfterElement(phoneNumInput, '');
            // phoneNumberIsCorrect() will erase the warning after this input */
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
                            setWarningAfterElement(logInBtn, `Покупця з такими даними не знайдено`);
                            return;
                        }
                        if (result.message.includes("several customers")) {
                            setWarningAfterElement(logInBtn, `Помилка: знайдено декілька покупців з таким номером телефону`);
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
    static showCustomerProfile(customerNameElem, { onExit = function () { } } = {}) {
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
    static createCustomerElement(customer) {
        customer.element = createElement({ name: 'div', class: 'customer' });
        customer.element?.setAttribute('id', customer.phone_num);
        const customerName = createElement({ class: 'name', content: `Ім'я: ` + customer.name });
        customer.element.append(customerName);
        const customerPhoneNum = createElement({ class: 'phone_num', content: 'Номер телефону: ' + customer.phone_num });
        customer.element.append(customerPhoneNum);
        const customerEmail = createElement({ class: 'email', content: 'Email: ' + customer.email });
        customer.element.append(customerEmail);
        const editInfoBtn = createElement({ name: 'button', class: 'edit_info_btn', content: 'Редагувати' });
        customer.element.append(editInfoBtn);
        const deleteBtn = createElement({ name: 'button', class: 'delete_btn', content: 'Видалити' });
        customer.element.append(deleteBtn);
        return customer;
    }
    static async editInfo(customerElement, callback = function () { }) {
        const oldInfo = {
            name: customerElement.querySelector('.name').textContent.split(': ')[1],
            phoneNum: customerElement.querySelector('.phone_num').textContent.split(': ')[1],
            email: customerElement.querySelector('.email').textContent.split(': ')[1],
        }
        console.log(oldInfo);
        const header = createElement({ name: "header", content: 'Редагування даних співробітника' });
        let nameLabel = createElement({ name: "header", content: "Введіть нове ім'я співробітника:" });
        let nameInput = createElement({ name: "input", content: oldInfo.name });
        nameInput.setAttribute("autocomplete", "off");
        const phoneNumLabel = createElement({ name: "header", content: "Введіть новий номер телефону співробітника" });
        const phoneNumInput = createElement({ name: "input", content: oldInfo.phoneNum, attributes: ["type: tel", "autocomplete: off"] });
        const emailLabel = createElement({ name: "header", content: "Введіть новий email співробітника" });
        const emailInput = createElement({ name: "input", content: oldInfo.email });
        emailInput.setAttribute("autocomplete", "off");
        const confirmChangesBtn = createElement({ name: 'button', content: "Підтвердити зміни", class: "confirm-changes-btn", style: "margin-top: 7px" });
        confirmChangesBtn.addEventListener("click", async event => {
            // setWarningAfterElement(oldPasswordInput, '');
            setWarningAfterElement(confirmChangesBtn, '');
            let everythingIsCorrect = nameIsCorrect(nameInput);
            everythingIsCorrect = phoneNumberIsCorrect(phoneNumInput) && everythingIsCorrect;
            everythingIsCorrect = emailIsCorrect(emailInput) && everythingIsCorrect;
            if (!everythingIsCorrect) {
                return;
            }
            try {
                let requestBody = {
                    editorName: localStorage.getItem("employeeName"),
                    newCustomerName: nameInput.value,
                    newCustomerPhoneNum: phoneNumInput.value,
                    newCustomerEmail: emailInput.value,
                    oldInfo, // oldInfo: oldInfo
                };
                let response = await fetch(location.origin + "/customers/edit", {
                    method: "PATCH",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("phone number already exists")) {
                            setWarningAfterElement(confirmChangesBtn, 'Покупець з таким номером телефону вже існує');
                            return;
                        }
                        /*if (result.message.includes("Wrong password")) {
                            setWarningAfterElement(confirmChangesBtn, `Неправильний старий пароль`);
                            return;
                        }*/
                        throw new Error(result.message || "Server error.");
                    } else {
                        event.target.closest(".modal-window").closeWindow();
                        callback();
                    }
                }
            } catch (error) {
                console.error(error.message);
                alert("Error");
                return;
            }
        });
        showModalWindow([header, nameLabel, nameInput,
            phoneNumLabel, phoneNumInput,
            emailLabel, emailInput,
            confirmChangesBtn],
            { className: 'edit-customer-data' });
    }
    static async delete(phoneNum) {
        try {
            if (localStorage.getItem("employeeName") !== 'Admin') {
                throw new Error("Employee is not admin");
            }
            let requestBody = {
                employeeWhoDeletesName: localStorage.getItem("employeeName"),
                customerToDeletePhoneNum: phoneNum,
            };
            let response = await fetch(location.origin + "/customers/delete", {
                method: "DELETE",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
                console.log(result);
                if (!result.success) {
                    throw new Error(result.message || "Server error.");
                } else {
                    return "success";
                }
            }
        } catch (error) {
            console.error(error.message);
            alert("Error");
        }
    }
}
