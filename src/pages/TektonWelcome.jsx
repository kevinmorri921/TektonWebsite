import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const TektonWelcome = () => {
  useEffect(() => {
    // Smooth scrolling for internal links
    const links = document.querySelectorAll(".navbar a, .btn");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const target = link.getAttribute("href");
        if (target && target.startsWith("#")) {
          e.preventDefault();
          document
            .querySelector(target)
            .scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", () => {});
      });
    };
  }, []);

  return (
    <div className="welcome-page min-h-screen flex flex-col font-sans w-full">
      {/* Navbar */}
      <header className="shadow-md bg-blue-800 fixed w-full top-0 z-10 text-white">
        <nav className="navbar flex justify-between items-center px-10 py-4 w-full">
          <div className="logo text-3xl font-bold">TEKTON</div>
          <ul className="flex space-x-8 text-lg">
            <li>
              <a href="#about" className="hover:text-gray-300">
                About
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-gray-300">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main
        id="hero"
        className="hero flex flex-col justify-center items-center text-center h-screen bg-gradient-to-b from-blue-500 to-blue-300 text-white w-full pt-20"
      >
        <h1 className="text-6xl font-extrabold mb-6 tracking-wide w-full">
          TEKTON GEOMETRIX
        </h1>
        <p className="text-2xl font-light mb-10 w-full px-4">
          Providing quality services in the fields of seismology, geology, and
          geophysics since 2012.
        </p>
        <div className="buttons flex flex-wrap justify-center gap-6 w-full">
          <Link
            to="/signup"
            className="btn border border-white text-white font-semibold px-10 py-3 rounded-lg hover:bg-white hover:text-blue-800 transition-all"
          >
            Sign Up
          </Link>
          
          <Link
            to="/login"
            className="btn border border-white text-white font-semibold px-10 py-3 rounded-lg hover:bg-white hover:text-blue-800 transition-all"
          >
            Log In
          </Link>
        </div>
      </main>

      {/* About Section */}
      <section
        id="about"
        className="section py-20 px-10 text-left bg-white w-full scroll-mt-20"
      >
        <h2 className="text-4xl font-bold text-blue-800 mb-6">
          About Us
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed w-full">
          Tekton Geometrix has been delivering reliable geological and
          geophysical services since 2012. Our team ensures precise and accurate
          results for all our projects. We specialize in applying modern
          technology and advanced fieldwork techniques to support your
          geoscientific needs.
        </p>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="section py-20 px-10 text-left bg-blue-100 w-full scroll-mt-20"
      >
        <h2 className="text-4xl font-bold text-blue-800 mb-6">
          Contact Us
        </h2>
        <p className="text-lg text-gray-800 mb-6">
          Email:{" "}
          <span className="font-medium text-blue-700">info@tekton.com</span> |
          Phone:{" "}
          <span className="font-medium text-blue-700">+63 912 345 6789</span>
        </p>
        <a
          href="#hero"
          className="btn bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-all"
        >
          Back to Top
        </a>
      </section>
    </div>
  );
};

export default TektonWelcome;
