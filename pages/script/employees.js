"use strict";

import Employee from "./class_Employee.js";
import { createElement, redirectNonAdmin } from "./useful-for-client.js";

// const employeeName = document.getElementById("employee-name");
// const accountBtn = document.getElementById("account-btn");
// const toAdminPageBtn = document.getElementById("to-admin-page-btn");
// const content = document.getElementsByTagName("main")[0];
const searchBtn = document.getElementById("search-btn");
const refreshBtn = document.getElementById("refresh-btn");
const addEmployeeBtn = document.getElementById("add-employee-btn");
const employeesContainer = document.getElementById("employees");

redirectNonAdmin(employeesContainer, null);

const searchInputsContainer = document.getElementsByClassName('search-inputs')[0];
let searchInputs = {};
for (const input of searchInputsContainer.querySelectorAll('input')) {
    searchInputs[input.getAttribute('name')] = input;
}

let employees = [];
let employeesToDisplay = [];

refreshBtn.addEventListener('click', async event => {
    try {
        let response = await fetch(location.origin + "/employees/get-employees", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Server error.");
            } else {
                // console.log(result.employees);
                employees = result.employees;
                searchBtn.click();
                // employeesReceived = true;
            }
        }
    } catch (error) {
        console.error(error.message);
        if (!error.message.includes("Failed to fetch")) {
            alert("Error");
        }
        return;
    }
})

refreshBtn.click();

searchBtn.addEventListener('click', async event => {
    if (employees.length == 0) {
        employeesContainer.textContent = "Співробітники відсутні.";
        return;
    }
    employeesToDisplay = employees.filter(employee => employee.name.includes(searchInputs.name.value))
        .filter(employee => employee.phone_num.includes(searchInputs.phone_num.value));
    if (employeesToDisplay.length === 0) {
        employeesContainer.textContent = "Немає співробітників, що задовільняють фільтри.";
        return;
    }
    employeesContainer.innerHTML = '';
    employeesToDisplay?.forEach(employee => {
        employeesContainer.append(Employee.createEmployeeElement(employee).element);
    });
})

addEmployeeBtn.addEventListener('click', event => {
    new Employee(() => refreshBtn.click());
})

employeesContainer.addEventListener('click', async event => {
    // employee deletion logic
    const deleteBtn = event.target.closest('.delete_btn');
    if (deleteBtn) {
        // console.log(deleteBtn);
        const employeeElement = deleteBtn.closest(".employee");
        const phoneNumber = employeeElement.getAttribute('id');
        if (await Employee.delete(phoneNumber) === "success") {
            if (!employeeElement) {
                refreshBtn.click();
            } else {
                employeeElement.classList.add("deleted");
                employeeElement.addEventListener("transitionend", event => {
                    employeeElement.remove();
                    refreshBtn.click();
                })
            }
        }
    }
    // employee info edition logic
    const editInfoBtn = event.target.closest('.edit_info_btn');
    if (editInfoBtn) {
        // console.log(editInfoBtn);
        const employeeElement = editInfoBtn.closest(".employee");
        await Employee.editInfo(employeeElement, () => refreshBtn.click());
    }
})