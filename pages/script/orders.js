"use strict";

import Employee from "./class_Employee.js";
import Orders from "./class_Orders.js";
import { dayAndMonthAreCorrect, isInt, setWarningAfterElement } from "./useful-for-client.js";

const employeeName = document.getElementById("employee-name");
const accountBtn = document.getElementById("account-btn");
const toRegisterSupplyPageBtn = document.getElementById("to-register-supply-page-btn");
const toAdminPageBtn = document.getElementById("to-admin-page-btn");
const content = document.getElementsByTagName("main")[0];
const searchBtn = document.getElementById("search-btn");
const refreshBtn = document.getElementById("refresh-btn");
const ordersContainer = document.getElementById("orders");

const searchInputsContainer = document.getElementsByClassName('search-inputs')[0];
let searchInputs = {};
for (const input of searchInputsContainer.querySelectorAll('input')) {
    searchInputs[input.getAttribute('name')] = input;
}
let dateTimeComponents = document.querySelectorAll('#datetime-period > .datetime-component');
dateTimeComponents = {
    from: {
        day: dateTimeComponents[0].children[1],
        month: dateTimeComponents[0].children[2],
        year: dateTimeComponents[0].children[3]
    },
    to: {
        day: dateTimeComponents[1].children[1],
        month: dateTimeComponents[1].children[2],
        year: dateTimeComponents[1].children[3]
    },
}
let currentDate = new Date();
dateTimeComponents.to.day.value = currentDate.getDate();
dateTimeComponents.to.month.value = currentDate.getMonth() + 1;
dateTimeComponents.to.year.value = currentDate.getFullYear();

let orders = new Orders();

function updateInterface() {
    toRegisterSupplyPageBtn.parentElement.style.display = "none";
    toAdminPageBtn.parentElement.style.display = "none";
    if (localStorage.getItem("employeeName") === null) {
        content.style.display = "none";
        employeeName.style.display = "none";
        // hide deleteOrderBtns
        Array.from(ordersContainer.getElementsByClassName('delete-order-btn'))
            ?.forEach(deleteOrderBtn => deleteOrderBtn.style.display = "none");
        Employee.showRegistrationWindow({
            onRegistered: updateInterface
        });
        return;
    }
    if (localStorage.getItem("employeeName") === 'Admin') {
        // show deleteOrderBtns
        Array.from(ordersContainer.getElementsByClassName('delete-order-btn'))
            ?.forEach(deleteOrderBtn => deleteOrderBtn.style.display = "");
        toAdminPageBtn.parentElement.style.display = "";
    } else {
        toRegisterSupplyPageBtn.parentElement.style.display = "";
    }
    employeeName.textContent = localStorage.getItem("employeeName");
    employeeName.style.display = "";
    content.style.display = "";
}
updateInterface();

accountBtn.addEventListener("click", event => {
    if (localStorage.getItem("employeeName") === null) {
        Employee.showRegistrationWindow({
            onRegistered: updateInterface
        });
    } else {
        Employee.showEmployeeProfile({
            onExit: updateInterface
        });
    }
});

refreshBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/orders/get-orders", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                orders = new Orders(result.orders);
                searchBtn.click();
            }
        }
    } catch (error) {
        console.error(error.message);
        if (!error.message.includes("Failed to fetch")) {
            alert("Error");
        }
    }
})

refreshBtn.click();

searchBtn.addEventListener('click', event => {
    let everythingIsCorrect = true, message = '';
    if (searchInputs.num.value.length > 0 && isInt(searchInputs.num.value).length > 0) {
        message = 'Номер чека повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    }
    if (searchInputs.customer_phone_num.value.length > 0 && isInt(searchInputs.customer_phone_num.value).length > 0) {
        message = 'Номер телефону покупця повинен складатися лише з цифр.';
        everythingIsCorrect = false;
    }
    for (const dateTimeComponentKey in dateTimeComponents) {
        const dateTimeComponent = dateTimeComponents[dateTimeComponentKey];
        let dateTimeComponentIsUsed = false;
        for (const key in dateTimeComponent) {
            dateTimeComponent[key].style.borderColor = '';
            if (!dateTimeComponentIsUsed && dateTimeComponent[key].value.length > 0) {
                dateTimeComponentIsUsed = true;
            }
        }
        if (!everythingIsCorrect || dateTimeComponentIsUsed === false) {
            continue;
            // do not type break in order to dateTimeComponent[key].style.borderColor = '' for all components
        }
        for (const key in dateTimeComponent) {
            if (dateTimeComponent[key].value.length == 0) {
                if (key === 'year') {
                    dateTimeComponent[key].value = new Date().getFullYear();
                    continue;
                }
                message = `День та місяць 
                    ${dateTimeComponentKey === 'to' ? 'кінця' : 'початку'} 
                    діапазону дат повинні бути заповнені.`;
                dateTimeComponent[key].style.borderColor = 'red';
                everythingIsCorrect = false;
                break;
            }
        }
        if (!everythingIsCorrect) {
            continue;
            // do not type break in order to dateTimeComponent[key].style.borderColor = '' for all components,
            // if (!everythingIsCorrect... above will not allow to set a new message
        }
        if (isInt(dateTimeComponent.day).length > 0 ||
            isInt(dateTimeComponent.month).length > 0 ||
            isInt(dateTimeComponent.year).length > 0 ||
            !dayAndMonthAreCorrect(dateTimeComponent.day, dateTimeComponent.month)) {
            message = `Некоректна або неіснуюча дата 
                ${dateTimeComponentKey === 'to' ? 'кінця' : 'початку'} 
                діапазону дат.`;
            everythingIsCorrect = false;
            continue;
        }
    }
    if (everythingIsCorrect === false) {
        setWarningAfterElement(searchBtn.parentElement, message);
        return;
    }
    setWarningAfterElement(searchBtn.parentElement, '');
    orders.filterAndRenderOrders(ordersContainer, searchInputs, dateTimeComponents, searchBtn);
})

ordersContainer.addEventListener('click', async event => {
    // 1: order deletion logic, 2: order issuance logic
    // 1: order deletion logic
    const deleteOrderBtn = event.target.closest('.delete-order-btn');
    if (deleteOrderBtn && localStorage.getItem("employeeName") === 'Admin') {
        try {
            let orderIndex = [...ordersContainer.querySelectorAll('.delete-order-btn')].findIndex(btn => btn === deleteOrderBtn);
            const orderElement = deleteOrderBtn.closest(".order");
            if (await orders.deleteOrder(orderIndex) === "success") {
                if (!orderElement) {
                    refreshBtn.click();
                } else {
                    orderElement.classList.add("deleted");
                    orderElement.addEventListener("transitionend", event => {
                        orderElement.remove();
                        refreshBtn.click();
                    })
                }
            }
        } catch (error) {
            console.error(error.message);
            alert("Error");
        }
        return;
    }
    // 2: order issuance logic
    const issuanceBtn = event.target.closest('.issuance-btn');
    if (!issuanceBtn) {
        return;
    }
    let orderIndex = [...ordersContainer.querySelectorAll('.issuance-btn')].findIndex(btn => btn === issuanceBtn);
    orders.issueOrder(orderIndex, {
        onComplete: (receipt_num) => {
            refreshBtn.click();
            let receiptLink = document.createElement("a");
            receiptLink.setAttribute('target', '_blank');
            receiptLink.href = location.origin + `/orders/receipt/${receipt_num}`;
            receiptLink.click();
        }
    });
})