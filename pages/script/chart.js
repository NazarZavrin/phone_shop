"use strict";

const canvas = document.getElementById("chart");

if (localStorage.getItem("employeeName") !== "Admin") {
    canvas.remove();
    alert("Доступ до цієї сторінки має тільки адміністратор.");
    window.close();
}

try {
    let dataForChart = JSON.parse(localStorage.getItem("dataForChart"));
    const dateBoundsForChart = localStorage.getItem("dateBoundsForChart");
    const months = ["Січень", "Лютий", "Березень", "Квітень", "Травень",
        "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    dataForChart = dataForChart.map(item => Object.assign(item, {
        monthAndYear: months[Number(item.month) - 1] + " " + item.year
    }));
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: dataForChart.map(item => item.monthAndYear), // data for X axis
            datasets: [
                {
                    label: 'Прибуток',
                    data: dataForChart.map(item => item.income), // data for Y axis
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderColor: 'dodgerblue',
                    backgroundColor: '#0077cc',
                    segment: {
                        borderColor: (ctx) => ctx.p0.parsed.y > ctx.p1.parsed.y ? 'royalblue' : undefined, // when values decline, color of line must be royalblue
                    },
                },
                {
                    label: 'Сплачено',
                    data: dataForChart.map(item => item.spending), // data for Y axis
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderColor: 'red',
                    backgroundColor: '#d00000',
                    segment: {
                        borderColor: (ctx) => ctx.p0.parsed.y > ctx.p1.parsed.y ? 'firebrick' : undefined, // when values decline, color of line must be of firebrick color
                    },
                },
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Графік прибутків та витрат (' + dateBoundsForChart + ')',
                    font: {
                        family: "Calibri, sans-serif",
                        size: 16,
                        lineHeight: 0.5
                    },
                    color: "black",
                    padding: { // top and bottom paddings of the chart title
                        top: 15,
                        bottom: 5
                    }
                },
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Місяць та рік'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Грошова сума (грн.)'
                    }
                },
            },
        }
    });
} catch (error) {
    console.error(error.message);
    alert("Не вдалося побудувати графік. Спробуйте ще раз.");
    window.close();
}