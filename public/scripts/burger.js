'use strict';

window.addEventListener('load', () => {
    checkResize();
    setItems();
    addListeners();
});

let btn;
let menu;
let isMobile;

const checkResize = () => {
    window.addEventListener('resize', () => {
        window.innerWidth < 992 ? isMobile = true : isMobile = false;
    });
};

const setItems = () => {
    btn = document.querySelector('#btn');
    menu = document.querySelector('#menu');
    window.innerWidth < 992 ? isMobile = true : isMobile = false;
};

const addListeners = () => {
    btn.addEventListener('click', handleMenu);
};

const handleMenu = () => {
    if (isMobile) {
        btn.classList.toggle('btn--burger--open');
        menu.classList.toggle('burger--open');
    }
};