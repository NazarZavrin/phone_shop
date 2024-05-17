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
    /*localStorage.removeItem("dataForChart");
    localStorage.removeItem("dateBoundsForChart");*/
    // console.log(...dataForChart);

    const months = ["Січень", "Лютий", "Березень", "Квітень", "Травень",
        "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    dataForChart = dataForChart.map(item => Object.assign(item, {
        monthAndYear: months[Number(item.month) - 1] + " " + item.year
    }));
    console.log(...dataForChart);
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
                    borderColor: 'red',// #d00000
                    backgroundColor: '#d00000',
                    segment: {
                        borderColor: (ctx) => ctx.p0.parsed.y > ctx.p1.parsed.y ? 'firebrick' : undefined, // when values decline, color of line must be maroon
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


/*
(async function() {
  const data = [
    { year: 2010, count: 10 },
    { year: 2011, count: 20 },
    { year: 2012, count: 15 },
    { year: 2013, count: 25 },
    { year: 2014, count: 22 },
    { year: 2015, count: 30 },
    { year: 2016, count: 28 },
  ];

  new Chart(
    canvas,
    {
      type: 'bar',
      data: {
        labels: data.map(row => row.year),
        datasets: [
          {
            label: 'Acquisitions by year',
            data: data.map(row => row.count)
          }
        ]
      }
    }
  );
})(); */

