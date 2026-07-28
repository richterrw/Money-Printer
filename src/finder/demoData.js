"use strict";

/* Offline sample leads so the whole pipeline runs without a Google API key.
 * Shape matches what the Places client produces, so `generate` treats demo
 * and live data identically. These are fictional businesses. */

module.exports = [
  {
    name: "Rosa's Taqueria",
    category: "Mexican restaurant",
    phone: "(208) 555-0142",
    address: "412 W Idaho St",
    city: "Boise",
    region: "ID",
    country: "US",
    website: null,
    rating: 4.7,
    reviewsCount: 213,
    placeId: null,
    hours: { mon: "11am–9pm", tue: "11am–9pm", wed: "11am–9pm", thu: "11am–9pm", fri: "11am–10pm", sat: "11am–10pm", sun: "Closed" },
    services: ["Street tacos & burritos", "Fresh salsa bar", "Catering for events", "Family meal deals"],
    reviews: [
      { author: "Marcus T.", rating: 5, text: "Best carne asada in town. The line moves fast and the staff are so friendly." },
      { author: "Priya N.", rating: 5, text: "Authentic, affordable, and generous portions. My go-to lunch spot." },
      { author: "Dave R.", rating: 4, text: "Great food. Wish they were open on Sundays!" }
    ]
  },
  {
    name: "Summit Plumbing & Drain",
    category: "Plumber",
    phone: "(208) 555-0198",
    address: "77 Commerce Ave",
    city: "Meridian",
    region: "ID",
    country: "US",
    website: null,
    rating: 4.9,
    reviewsCount: 88,
    placeId: null,
    hours: { mon: "7am–6pm", tue: "7am–6pm", wed: "7am–6pm", thu: "7am–6pm", fri: "7am–6pm", sat: "8am–2pm", sun: "Emergency only" },
    services: ["Emergency repairs 24/7", "Water heater install", "Drain cleaning", "Licensed & insured", "Free estimates"],
    reviews: [
      { author: "Karen W.", rating: 5, text: "Came out same day and fixed a burst pipe in under an hour. Fair price, no upsell." },
      { author: "Tom B.", rating: 5, text: "Professional and tidy. Explained everything before starting." }
    ]
  },
  {
    name: "Bloom & Petal Florist",
    category: "Florist",
    phone: "(208) 555-0176",
    address: "1220 N 8th St",
    city: "Boise",
    region: "ID",
    country: "US",
    website: "http://bloomandpetal.angelfire.com", // outdated site on purpose
    rating: 4.6,
    reviewsCount: 54,
    placeId: null,
    hours: { mon: "9am–6pm", tue: "9am–6pm", wed: "9am–6pm", thu: "9am–6pm", fri: "9am–6pm", sat: "10am–4pm", sun: "Closed" },
    services: ["Wedding arrangements", "Same-day delivery", "Seasonal bouquets", "Sympathy flowers"],
    reviews: [
      { author: "Elena G.", rating: 5, text: "They made my wedding flowers and they were stunning. Highly recommend." },
      { author: "Sam P.", rating: 4, text: "Beautiful arrangements, lovely people." }
    ]
  },
  {
    name: "The Sharp Fade Barbershop",
    category: "Barber",
    phone: "(208) 555-0110",
    address: "305 S Capitol Blvd",
    city: "Boise",
    region: "ID",
    country: "US",
    website: null,
    rating: 4.8,
    reviewsCount: 167,
    placeId: null,
    hours: { mon: "Closed", tue: "9am–7pm", wed: "9am–7pm", thu: "9am–7pm", fri: "9am–7pm", sat: "8am–5pm", sun: "10am–3pm" },
    services: ["Skin fades & tapers", "Hot towel shaves", "Beard trims", "Walk-ins welcome", "Kids' cuts"],
    reviews: [
      { author: "Jordan L.", rating: 5, text: "Cleanest fade I've had in years. Been coming here for months now." },
      { author: "Mike D.", rating: 5, text: "Great vibe, great cut, no wait if you book ahead." }
    ]
  }
];
