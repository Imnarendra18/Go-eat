import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { Bike, ChevronLeft, ChevronRight, Clock, Sparkles, Utensils } from "lucide-react";
import { getUser } from "../utils/app";
import HotelDashboard from "./hotel/HotelDashboard";

const heroSlides = [
  {
    src: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1100&q=80",
    alt: "Fresh food spread",
    label: "20 min average prep",
  },
  {
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1100&q=80",
    alt: "Restaurant dishes on a table",
    label: "Menus ready to explore",
  },
  {
    src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1100&q=80",
    alt: "Restaurant counter with fresh food",
    label: "Hotels manage orders live",
  },
];

export default function Home() {
  const user = getUser();
  const [activeSlide, setActiveSlide] = useState(0);
  const visualRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!visualRef.current || !imageRef.current) return;

    animate(imageRef.current, {
      opacity: [0.35, 1],
      translateX: [34, 0],
      scale: [1.04, 1],
      duration: 680,
      ease: "outCubic",
    });

    animate(visualRef.current.querySelector(".floatCard"), {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 520,
      delay: 130,
      ease: "outCubic",
    });
  }, [activeSlide]);

  const moveSlide = (direction) => {
    setActiveSlide((slide) => (slide + direction + heroSlides.length) % heroSlides.length);
  };

  const slide = heroSlides[activeSlide];

  if (user?.role === "HOTEL") {
    return <HotelDashboard />;
  }

  return (
    <>
      <section className="hero">
        <div className="heroText">
          <span className="badge">
            {user?.role === "USER"
              ? `Welcome, ${user.name}`
              : "Hot meals, clean checkout, live ordering"}
          </span>
          <h1>Food delivery that feels fast before the first bite.</h1>
          <p>
            Browse restaurants, build a cart, place orders, manage hotel menus,
            and track the complete flow from one polished GoEat interface.
          </p>
        </div>
        <div className="heroVisual" ref={visualRef}>
          <img
            ref={imageRef}
            src={slide.src}
            alt={slide.alt}
          />
          <div className="floatCard">
            <Sparkles size={20} /> {slide.label}
          </div>
          <div className="sliderControls" aria-label="Hero image slider">
            <button className="iconBtn" type="button" onClick={() => moveSlide(-1)} aria-label="Previous image">
              <ChevronLeft size={18} />
            </button>
            <div className="sliderDots">
              {heroSlides.map((item, index) => (
                <button
                  key={item.src}
                  className={index === activeSlide ? "active" : ""}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show ${item.alt}`}
                />
              ))}
            </div>
            <button className="iconBtn" type="button" onClick={() => moveSlide(1)} aria-label="Next image">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <Utensils size={30} />
          <h3>Curated menus</h3>
          <p>Search foods by dish, category, veg preference, and hotel.</p>
        </div>
        <div className="feature">
          <Bike size={30} />
          <h3>Order flow</h3>
          <p>
            Cart, checkout, orders, status updates, and delivery views are
            wired.
          </p>
        </div>
        <div className="feature">
          <Clock size={30} />
          <h3>Hotel tools</h3>
          <p>
            Owners can create hotels, add dishes, and manage menu availability.
          </p>
        </div>
      </section>
    </>
  );
}
