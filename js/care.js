console.log("CARE Website Loaded");
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let currentSlide = 0;

function showSlide(index) {

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    slides[index].classList.add("active");
    dots[index].classList.add("active");
}

nextBtn.addEventListener("click", () => {

    currentSlide++;

    if(currentSlide >= slides.length){
        currentSlide = 0;
    }

    showSlide(currentSlide);

});

prevBtn.addEventListener("click", () => {

    currentSlide--;

    if(currentSlide < 0){
        currentSlide = slides.length - 1;
    }

    showSlide(currentSlide);

});
const searchIcon = document.querySelector(".search-icon");
const searchBox = document.querySelector(".search-box");

searchIcon.addEventListener("click", () => {

    searchBox.classList.toggle("show");

});