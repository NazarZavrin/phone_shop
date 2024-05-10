"use strict";

import Customer from "./class_Customer.js";
import { redirectNonAdmin } from "./useful-for-client.js";

const searchBtn = document.getElementById("search-btn");
const refreshBtn = document.getElementById("refresh-btn");
const addCustomerBtn = document.getElementById("add-customer-btn");
const customersContainer = document.getElementById("customers");

redirectNonAdmin(customersContainer, null);

const searchInputsContainer = document.getElementsByClassName('search-inputs')[0];
let searchInputs = {};
for (const input of searchInputsContainer.querySelectorAll('input')) {
    searchInputs[input.getAttribute('name')] = input;
}

let customers = [];
let customersToDisplay = [];

refreshBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/customers/get-customers", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                customers = result.customers;
                searchBtn.click();
            }
        }
    } catch (error) {
        console.error(error.message);
        alert("Error");
    }
})

refreshBtn.click();

searchBtn.addEventListener('click', async event => {
    if (customers.length == 0) {
        customersContainer.textContent = "Покупці відсутні.";
        return;
    }
    customersToDisplay = customers.filter(customer => customer.name.includes(searchInputs.name.value))
        .filter(customer => customer.phone_num.includes(searchInputs.phone_num.value));
    if (customersToDisplay.length === 0) {
        customersContainer.textContent = "Немає покупців, що задовільняють фільтри.";
        return;
    }
    customersContainer.innerHTML = '';
    customersToDisplay?.forEach(customer => {
        customersContainer.append(Customer.createCustomerElement(customer).element);
    });
})

addCustomerBtn.addEventListener('click', event => {
    new Customer(() => refreshBtn.click(), { creator: "Admin" });
})

customersContainer.addEventListener('click', async event => {
    // customer deletion logic
    const deleteBtn = event.target.closest('.delete_btn');
    if (deleteBtn) {
        const customerElement = deleteBtn.closest(".customer");
        const phoneNum = customerElement.getAttribute('id');
        if (await Customer.delete(phoneNum) === "success") {
            if (!customerElement) {
                refreshBtn.click();
            } else {
                customerElement.classList.add("deleted");
                customerElement.addEventListener("transitionend", event => {
                    customerElement.remove();
                    refreshBtn.click();
                })
            }
        }
    }
    // customer info edition logic
    const editInfoBtn = event.target.closest('.edit_info_btn');
    if (editInfoBtn) {
        const customerElement = editInfoBtn.closest(".customer");
        await Customer.editInfo(customerElement, () => refreshBtn.click());
    }
})