"use strict";
(async () => {
    try {
        let response = await fetch(location.href, {
            method: "PROPFIND",
            headers: { "Content-Type": "application/json" }
        })
        if (response.ok) {
            let result = await response.json();
            if (!result.success) {
                if (result.message.includes("Non-existent")) {
                    document.body.children[0].textContent = `Неіснуючий номер чеку.`;
                } else {
                    throw new Error(result.message || "Server error.");
                }
            } else {
                let order = result.order;
                const labels = {
                    cost: "Вартість",
                    paid: "Сплачено",
                    change: "Решта",
                }
                for (let key in order) {
                    if (key === "orderItems") {
                        continue;
                    } else if (key.includes("datetime")) {
                        order[key] = new Date(order[key]).toLocaleString();
                    } else if (key === "num") {
                        order['receipt_num'] = order[key];
                        key = 'receipt_num';
                    }
                    document.getElementsByClassName(key)[0].textContent += order[key] || '';
                }
                order.orderItems.forEach(orderItem => {
                    let text = orderItem.product_brand + ' ' + orderItem.product_name + ' (' + orderItem.amount + ' шт.)';
                    document.querySelector(".receipt_body").insertAdjacentHTML("beforeend",
                        `<div class="order-item">${text}</div>
                    <div class="order-item-cost">${orderItem.cost} грн.</div>`);
                })
                const change = Number(order.paid) - Number(order.cost);
                document.querySelector(".change").textContent += change.toFixed(change % 1 === 0 ? 0 : 2);
                // ↑ if change is integer number (change % 1 === 0) then we will not output fraction digits, otherwise we will output 2 fraction digits
                for (const item in labels) {
                    let elem = document.getElementsByClassName(item)[0];
                    elem.textContent += " грн.";
                    elem.insertAdjacentHTML("beforebegin",
                        `<div>${labels[item]}</div>`);
                }
                document.body.getElementsByTagName("pre")[0]?.remove();
                document.getElementsByClassName("wrapper")[0].style.display = "";
            }
        } else {
            document.body.children[0].textContent = `Server error.`;
        }
    } catch (error) {
        console.error(error.message);
        alert("Error");
    }
})();