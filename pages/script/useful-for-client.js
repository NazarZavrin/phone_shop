export function showModalWindow(elementsArray, { style = "", className = "", handlers: eventHandlers = [], showCross = true, bodyElement = document.body } = {}) {
    let modalWindow = createElement({ name: "div", class: "modal-window " + className, style: style });
    elementsArray.forEach(element => {
        if (element) {
            modalWindow.append(element);
        }
    });
    if (showCross == true) {
        let cross = createElement({ name: "div", class: "modal-window-cross" });
        cross.innerHTML = '<img src="/img/cross.png" alt="Close">';
        modalWindow.append(cross);
        cross.addEventListener("click", event => {
            modalWindow.closeWindow();
        });
    }
    eventHandlers.forEach(({ eventName, handler, options = {} }) => modalWindow.addEventListener(eventName, handler, options));
    modalWindow.closeWindow = function () {
        background.remove();
        background = null;
        bodyElement.style.overflow = "auto";
    }
    let background = createElement({ name: "div", class: "background" });
    bodyElement.style.overflow = "hidden";
    background.append(modalWindow);
    bodyElement.prepend(background);
    background.addEventListener("mouseup", event => {
        if (!event.target.closest(".modal-window")) {
            background.children[0].closeWindow();
        }
    });
}
export function createElement({ name: elemName = "div", style = "", content = "", class: className = "", attributes = [] } = {}) {
    // attributes - array of objects with keys "name" and "value"
    let element = document.createElement(elemName);
    if (elemName == "input") {
        element.value = content;
    } else {
        element.textContent = content;
    }
    if (className) element.className = className;
    if (style) element.style.cssText = style;
    attributes.forEach(attribute => element.setAttribute(...attribute.split(/\s*:\s*/)));
    return element;
}
export function showPassword(event) {
    const checkbox = event.target.closest('input[type="checkbox"]');
    const passwordInput = this.querySelector('input:not([type="checkbox"])');
    if (!checkbox || !passwordInput) {
        return;
    }
    if (passwordInput.type === "password" && checkbox.checked === true) {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}
export function setWarningAfterElement(element, warningText) {
    if (element.nextElementSibling?.matches('.warning')) {
        element.nextElementSibling.textContent = warningText;
    } else {
        element.insertAdjacentHTML("afterend", `<b class="warning">${warningText}</b>`);
    }
    if (warningText === "") { // if warning text is empty
        element.nextElementSibling.style.width = "0";// set width of warning element to 0
    } else {
        element.nextElementSibling.style.width = "";// set width of warning element to normal
    }
}
export function nameIsCorrect(inputElement, elementForWarning = null, beginning = "Ім'я") {
    let warningText = "";
    if (inputElement.value.length > 50) {
        warningText = beginning + " не повинно бути більше, ніж 50 символів.";
    } else if (inputElement.value.length < 3) {
        warningText = beginning + " не повинно бути менше, ніж 3 символи.";
    }
    elementForWarning = elementForWarning || inputElement;
    setWarningAfterElement(elementForWarning, warningText);
    return warningText.length > 0 ? false : true;
}
export function phoneNumberIsCorrect(inputElement, elementForWarning = null, beginning = "Номер телефону") {
    let warningText = "";
    if (inputElement.value.length > 20) {
        warningText = beginning + " не повинен бути більше, ніж 20 символів.";
    } else if (inputElement.value.length < 3) {
        warningText = beginning + " не повинен бути менше, ніж 3 символи.";
    } else {
        for (const symbol of inputElement.value) {
            if (Number.isNaN(Number(symbol))) {
                warningText = beginning + " повинен складатися лише з цифр.";
                break;
            }
        }
    }
    elementForWarning = elementForWarning || inputElement;
    setWarningAfterElement(elementForWarning, warningText);
    return warningText.length > 0 ? false : true;
}
const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+$/;
// console.log("Some-Email@gmail.com".match(emailRegex));
// console.log("wrong@email@gmail.com".match(emailRegex));
export function emailIsCorrect(inputElement, elementForWarning = null) {
    let warningText = "";
    if (inputElement.value.length > 50) {
        warningText = "Email не повинен бути більше, ніж 50 символів.";
    } else if (!inputElement.value.match(emailRegex)) {
        warningText = "Некоректний email.";
    }
    elementForWarning = elementForWarning || inputElement;
    setWarningAfterElement(elementForWarning, warningText);
    return warningText.length > 0 ? false : true;
}
export function passwordIsCorrect(inputElement, elementForWarning = null) {
    let warningText = "";
    if (inputElement.value.length > 20) {
        warningText = "Пароль не повинен бути більше ніж 20 символів.";
    } else if (inputElement.value.length < 4) {
        warningText = "Пароль не повинен бути менше ніж 4 символи.";
    } else if (inputElement.value.search(/\s/) >= 0) {
        warningText = "Пароль не повинен містити пробільні символи.";
    }
    elementForWarning = elementForWarning || inputElement;
    setWarningAfterElement(elementForWarning, warningText);
    return warningText.length > 0 ? false : true;
}

export function isInt(source) {
    let text = source;
    // console.log(source?.tagName === "INPUT", source?.value);
    if (source?.tagName === "INPUT" && typeof source?.value === 'string') {
        // console.log("+");
        text = source.value;
        source.style.borderColor = '';
    }
    for (const symbol of text) {
        if (Number.isNaN(Number(symbol))) {
            // console.log(source);
            if (source?.style) {
                source.style.borderColor = 'red';
            }
            if (symbol === "." || symbol === ",") {
                return "Decimal point can't be present in integer.";
            }
            return "Incorrect symbol.";
        }
    }
    return "";
}
export function isFloat(text) {
    for (const symbol of text) {
        if (Number.isNaN(Number(symbol))) {
            if (symbol === "." || symbol === ",") {
                if (text.split(/[.,]/).length > 2) {
                    return "Decimal point was found more than once.";
                } else {
                    continue;
                }
            }
            return "Incorrect symbol.";
        }
    }
    return "";
}
export function dayAndMonthAreCorrect(daySource, monthSource) {
    let day = daySource, month = monthSource;
    if (daySource?.tagName === "INPUT" && typeof daySource?.value === 'string') {
        day = Number(daySource.value);
        daySource.style.borderColor = '';
    }
    if (monthSource?.tagName === "INPUT" && typeof monthSource?.value === 'string') {
        month = Number(monthSource.value);
        monthSource.style.borderColor = '';
    }
    let dayIsCorrect = true, monthIsCorrect = true;
    if (day > 31 || day <= 0) {
        dayIsCorrect = false;
    }
    if (month > 12 || month <= 0) {
        monthIsCorrect = false;
    }
    // в квітні (4), червні (6), вересні (9) та листопаді (11) 30 днів
    // в січні (1), березні (3), травні (5), липні (7),
    //  серпні (8), жовтні (10) та грудні (12) 31 день
    // в лютому (2) максимум 29 днів (у високосному році)
    if (month == 2 && day > 29) {
        dayIsCorrect = false;
    } else if (day == 31) {
        if (month == 4 || month == 6 || month == 9 || month == 11) {
            dayIsCorrect = false;
        }
    }
    if (!dayIsCorrect && daySource?.style) {
        daySource.style.borderColor = 'red';
    }
    if (!monthIsCorrect && monthSource?.style) {
        monthSource.style.borderColor = 'red';
    }
    return dayIsCorrect && monthIsCorrect;
}