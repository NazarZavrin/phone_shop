"use strict";

export default class Basket {
    #storageLabel = "phone: ";
    constructor() {}
    addProduct(name, brand, price) {
        localStorage.setItem(`${this.#storageLabel}${name}`, JSON.stringify({
            brand: brand,
            price: price,
            amount: 1
        }));
    }
    getProducts() {
        const products = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.#storageLabel}`)) {
                const info = JSON.parse(localStorage.getItem(key));
                const productName = key.split(this.#storageLabel)[1];
                products.push(Object.assign(info, { productName: productName }));
            }
        }
        return products;

        // const productInfo = JSON.parse(localStorage.getItem(`phone: ${name}`));
        // return Object.assign(productInfo, { name: name });
    }
    deleteProduct(name) {
        localStorage.removeItem(`${this.#storageLabel} ${name}`);
    }
}