"use strict";

import { createElement, emailIsCorrect, passwordIsCorrect, phoneNumberIsCorrect, setWarningAfterElement, showModalWindow, showPassword, nameIsCorrect, passportNumIsCorrect } from "./useful-for-client.js";

// let employees = [];
// let employeesToDisplay = [];

export default class Employee {
    constructor(callback = function () { }) {
        const header = createElement({ name: "header", content: "Створення акаунту співробітника" });
        const nameLabel = createElement({ name: "header", content: "Введіть ім'я співробітника:" });
        const nameInput = createElement({ name: "input" });
        nameInput.setAttribute("autocomplete", "off");
        const phoneNumLabel = createElement({ name: "header", content: "Введіть номер телефону співробітника:" });
        const phoneNumInput = createElement({ name: "input", attributes: ["type: tel", "autocomplete: off"] });
        const emailLabel = createElement({ name: "header", content: "Введіть email співробітника:" });
        const emailInput = createElement({ name: "input" });
        emailInput.setAttribute("autocomplete", "off");
        const passportNumLabel = createElement({ name: "header", content: "Введіть номер паспорту співробітника:" });
        const passportNumInput = createElement({ name: "input" });
        passportNumInput.setAttribute("autocomplete", "off");
        const passwordLabel = createElement({ name: "label", content: "Введіть пароль для співробітника:" });
        const passwordInput = createElement({ name: "input", attributes: ["type: password", "autocomplete: off"] });
        const passwordBlock = createElement({ name: "form", class: "password-block" });
        passwordBlock.innerHTML = `<label class="show-password">
    <input type="checkbox">Показати пароль</label>`;
        passwordBlock.prepend(passwordInput);
        passwordBlock.addEventListener("change", showPassword);
        const createAccountBtn = createElement({ name: 'button', content: "Створити акаунт", class: "create-account-btn" });
        createAccountBtn.addEventListener("click", async event => {
            /*setWarningAfterElement(nameInput, '');
            setWarningAfterElement(phoneNumberInput, '');
            setWarningAfterElement(emailInput, '');
            setWarningAfterElement(passwordInput, '');*/
            setWarningAfterElement(createAccountBtn, '');
            let everythingIsCorrect = nameIsCorrect(nameInput);
            everythingIsCorrect = phoneNumberIsCorrect(phoneNumInput) && everythingIsCorrect;
            everythingIsCorrect = emailIsCorrect(emailInput) && everythingIsCorrect;
            everythingIsCorrect = passportNumIsCorrect(passportNumInput) && everythingIsCorrect;
            everythingIsCorrect = passwordIsCorrect(passwordInput) && everythingIsCorrect;
            if (!everythingIsCorrect) {
                return;
            }
            try {
                let requestBody = {
                    creatorName: localStorage.getItem("employeeName"),
                    name: nameInput.value,
                    phoneNum: phoneNumInput.value,
                    email: emailInput.value,
                    passportNum: passportNumInput.value,
                    password: passwordInput.value
                };
                let response = await fetch(location.origin + "/employees/create-account", {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("phone number already exists")) {
                            setWarningAfterElement(createAccountBtn, 'Співробітник з таким номером телефону вже існує');
                            return;
                        }
                        if (result.message.includes("passport number already exists")) {
                            setWarningAfterElement(createAccountBtn, 'Співробітник з таким номером паспорту вже існує');
                            return;
                        }
                        throw new Error(result.message || "Server error.");
                    } else {
                        event.target.closest(".modal-window").closeWindow();
                        callback(result.employeeData.name, result.employeeData.phone_num);
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
            passportNumLabel, passportNumInput,
            passwordLabel, passwordBlock,
            createAccountBtn],
            { className: 'create-account' });
    }
    static showRegistrationWindow(employeeNameElem, { onRegistered = function () { } }) {
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
                let response = await fetch(location.origin + "/employees/log-in", {
                    method: "PROPFIND",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("not exist")) {
                            setWarningAfterElement(logInBtn, `Співробітника з такими даними не існує`);
                            return;
                        }
                        if (result.message.includes("several employees")) {
                            setWarningAfterElement(logInBtn, `Помилка: знайдено декілька співробітників з таким номером телефону.`);
                            return;
                        }
                        if (result.message.includes("Wrong password")) {
                            setWarningAfterElement(logInBtn, `Неправильний пароль`);
                            return;
                        }
                        throw new Error(result.message || "Server error.");
                    } else {
                        localStorage.setItem("employeeName", result.employeeData.name);
                        localStorage.setItem("employeePhoneNum", result.employeeData.phone_num);
                        onRegistered();
                        event.target.closest(".modal-window").closeWindow();
                    }
                }
            } catch (error) {
                console.error(error.message);
                alert("Error");
                return;
            }
        });
        showModalWindow([phoneNumLabel, phoneNumInput,
            passwordLabel, passwordBlock,
            logInBtn],
            { className: 'registration' });
    }
    static showEmployeeProfile(employeeNameElem, { onExit = function () { } } = {}) {
        const employeeInfo = createElement({ name: 'section', class: 'info' });
        employeeInfo.innerHTML = `<div>${localStorage.getItem("employeeName")}</div>
            <div>${localStorage.getItem("employeePhoneNum")}</div>`;
        // add employee's passportNum and email here
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
                        employeePhoneNum: localStorage.getItem("employeePhoneNum"),
                        oldPassword: oldPasswordInput.value,
                        newPassword: newPasswordInput.value,
                    };
                    let response = await fetch(location.origin + "/employees/change-password", {
                        method: "PATCH",
                        body: JSON.stringify(requestBody),
                        headers: { "Content-Type": "application/json" }
                    })
                    if (response.ok) {
                        let result = await response.json();
                        if (!result.success) {
                            if (result.message.includes("does not exist")) {
                                setWarningAfterElement(changePasswordBtn, `Співробітника з такими даними не існує`);
                                return;
                            }
                            if (result.message.includes("several employees")) {
                                setWarningAfterElement(changePasswordBtn, `Помилка: знайдено декілька cпівробітників з таким номером телефону.`);
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
            localStorage.removeItem("employeeName");
            localStorage.removeItem("employeePhoneNum");
            onExit();
            event.target.closest(".modal-window").closeWindow();
        });
        showModalWindow([employeeInfo, changePasswordBtn,
            exitBtn],
            { className: 'profile' });
    }
    static createEmployeeElement(employee) {
        employee.element = createElement({ name: 'div', class: 'employee' });
        employee.element?.setAttribute('id', employee.phone_num);
        const employeeName = createElement({ class: 'name', content: `Ім'я: ` + employee.name });
        employee.element.append(employeeName);
        const employeePhoneNum = createElement({ class: 'phone_num', content: 'Номер телефону: ' + employee.phone_num });
        employee.element.append(employeePhoneNum);
        const employeePassportNum = createElement({ class: 'passport_num', content: 'Номер паспорту: ' + employee.passport_num });
        employee.element.append(employeePassportNum);
        const employeeEmail = createElement({ class: 'email', content: 'Email: ' + employee.email });
        employee.element.append(employeeEmail);
        const editInfoBtn = createElement({ name: 'button', class: 'edit_info_btn', content: 'Редагувати' });
        employee.element.append(editInfoBtn);
        const deleteBtn = createElement({ name: 'button', class: 'delete_btn', content: 'Видалити' });
        employee.element.append(deleteBtn);
        return employee;
    }
    /*// !!! to do
    static async fetchEmployees() {
        try {
            let requestBody = {
                employeeName: localStorage.getItem("employeeName"),
            };
            let response = await fetch(location.origin + "/employees/get-employees", {
                method: "PROPFIND",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || "Server error.");
                } else {
                    // console.log(result.employees);
                    employees = result.employees
                        .map(this.createEmployeeElement);
                    // console.log(employees);
                    // employees = [];
                }
            }
        } catch (error) {
            console.error(error.message);
            alert("Error");
        }
    }*/
    /*// !!! to do
    static renderEmployees(employeesContainer, searchInput) {
        employeesContainer.innerHTML = '<button id="create-employee">Створити співробітника</button>';
        if (!employees || employees.length === 0) {
            employeesContainer.insertAdjacentText("beforeend", "Співробітників немає.");
            return;
        }
        // console.log(employees, searchInput.value);
        // console.log(employees.length);
        employeesToDisplay = employees.filter(employee => employee.name.toLocaleLowerCase().includes(searchInput.value.toLocaleLowerCase()));

        if (employeesToDisplay.length === 0) {
            employeesContainer.insertAdjacentText("beforeend", "Немає співробітників, ім'я яких містить рядок пошуку.");
            return;
        }
        employeesToDisplay?.forEach(employee => {
            employeesContainer.append(employee.element || this.createEmployeeElement(employee).element);
        })
    }*/
    static async editInfo(employeeElement, callback = function () { }) {
        const oldInfo = {
            name: employeeElement.querySelector('.name').textContent.split(': ')[1],
            phoneNum: employeeElement.querySelector('.phone_num').textContent.split(': ')[1],
            passportNum: employeeElement.querySelector('.passport_num').textContent.split(': ')[1],
            email: employeeElement.querySelector('.email').textContent.split(': ')[1],
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
        const passportNumLabel = createElement({ name: "header", content: "Введіть новий номер паспорту співробітника" });
        const passportNumInput = createElement({ name: "input", content: oldInfo.passportNum });
        passportNumInput.setAttribute("autocomplete", "off");
        const confirmChangesBtn = createElement({ name: 'button', content: "Підтвердити зміни", class: "confirm-changes-btn" });
        confirmChangesBtn.addEventListener("click", async event => {
            // setWarningAfterElement(oldPasswordInput, '');
            setWarningAfterElement(confirmChangesBtn, '');
            let everythingIsCorrect = nameIsCorrect(nameInput);
            everythingIsCorrect = phoneNumberIsCorrect(phoneNumInput) && everythingIsCorrect;
            everythingIsCorrect = emailIsCorrect(emailInput) && everythingIsCorrect;
            everythingIsCorrect = passportNumIsCorrect(passportNumInput) && everythingIsCorrect;
            if (!everythingIsCorrect) {
                return;
            }
            try {
                let requestBody = {
                    editorName: localStorage.getItem("employeeName"),
                    newEmployeeName: nameInput.value,
                    newEmployeePhoneNum: phoneNumInput.value,
                    newEmployeeEmail: emailInput.value,
                    newEmployeePassportNum: passportNumInput.value,
                    oldInfo, // oldInfo: oldInfo
                };
                let response = await fetch(location.origin + "/employees/edit", {
                    method: "PATCH",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                })
                if (response.ok) {
                    let result = await response.json();
                    if (!result.success) {
                        if (result.message.includes("phone number already exists")) {
                            setWarningAfterElement(confirmChangesBtn, 'Співробітник з таким номером телефону вже існує');
                            return;
                        }
                        if (result.message.includes("Wrong password")) {
                            setWarningAfterElement(confirmChangesBtn, `Неправильний старий пароль`);
                            return;
                        }
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
            passportNumLabel, passportNumInput,
            confirmChangesBtn],
            { className: 'edit-employee-data' });
    }
    static async delete(phoneNum) {
        try {
            if (localStorage.getItem("employeeName") !== 'Admin') {
                throw new Error("Employee is not admin");
            }
            let requestBody = {
                employeeWhoDeletesName: localStorage.getItem("employeeName"),
                employeeToDeletePhoneNum: phoneNum,
            };
            // console.log(phoneNum);
            let response = await fetch(location.origin + "/employees/delete", {
                method: "DELETE",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            })
            if (response.ok) {
                let result = await response.json();
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
