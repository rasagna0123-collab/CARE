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
// ================= HERO SLIDE LINKS =================

// Slide 1
document.getElementById("slide1").addEventListener("click", () => {
    window.location.href = "all-products.html";
});

// Slide 2
document.getElementById("slide2").addEventListener("click", () => {
    window.location.href = "face-essentials.html";
});

// Slide 3
document.getElementById("slide3").addEventListener("click", () => {
    window.location.href = "body-essentials.html";
});

// Slide 4
document.getElementById("slide4").addEventListener("click", () => {
    window.location.href = "hair-essentials.html";
});

// Slide 5
document.getElementById("slide5").addEventListener("click", () => {
    window.location.href = "bestsellers.html";
});