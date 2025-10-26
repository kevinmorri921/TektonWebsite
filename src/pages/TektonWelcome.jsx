import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TektonWelcome = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    // Navbar background change on scroll
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Smooth scroll for internal links
    const links = document.querySelectorAll(".scroll-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const target = link.getAttribute("href");
        if (target && target.startsWith("#")) {
          e.preventDefault();
          document.querySelector(target).scrollIntoView({
            behavior: "smooth",
          });
        }
      });
    });
    return () => {
      links.forEach((link) =>
        link.removeEventListener("click", () => {})
      );
    };
  }, []);
 
  useEffect(() => {
    // IntersectionObserver for active section
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.6 } // 60% of the section visible
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="bg-[#303345] text-white w-screen min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <header
        className="fixed w-full top-0 flex justify-center items-center px-10 py-6 z-50 transition-colors duration-500"
        style={{
          backgroundColor:
            activeSection === "hero" ? "transparent" : "#323548",
        }}
      >
        {/* Gradient Logo */}
        <a
          href="https://www.tektongeometrix.com/"
          target="_blank" rel="noopener noreferrer"
          className="text-3xl font-bold bg-gradient-to-r from-[#ff5733] via-[#c74e39] to-[#e03a3c] bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-300 ml-25"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          TEKTON GEOMETRIX
        </a> 
        <nav className="flex space-x-4 ml-auto mr-30">
          <a href="#hero" className={`scroll-link px-6 py-1 rounded-full transition-all duration-300 hover:text-[#ff5733] hover:bg-white/10 ${
              activeSection === "hero" ? "text-[#ff5733]" : "text-white" }`} >
            Home </a>
          <a href="#about" className={`scroll-link px-6 py-1 rounded-full transition-all duration-300 hover:text-[#ff5733] hover:bg-white/10 ${
              activeSection === "about" ? "text-[#ff5733]" : "text-white" }`} >
            About </a>
          <a href="#contact" className={`scroll-link px-6 py-1 rounded-full transition-all duration-300 hover:text-[#ff5733] hover:bg-white/10 ${
              activeSection === "contact" ? "text-[#ff5733]" : "text-white" }`} >
            Contact </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section
          id="hero"
          className="flex flex-col items-center justify-center text-center h-screen w-full px-6 bg-[#303345] animate-fadeIn relative">
          <div className="relative -mt-10 flex flex-col items-center justify-center w-full max-w-4xl">
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="bg-white/10 rounded-xl shadow-lg w-full h-auto md:h-75 transform scale-103"></div>
            </div>
            <div className="relative bg-[#323548] p-10 md:p-16 rounded-xl shadow-2xl flex flex-col items-center gap-4 w-full">
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-widest font-poppins text-white mb-2">
                TEKTON GEOMETRIX </h1>
              <p className="text-base md:text-sm text-white/80 mb-8 max-w-2xl">
                Providing quality services in the fields of seismology, geology, and geophysics since 2012. </p>
              <div className="flex flex-wrap gap-15 justify-center">
                <Link to="/signup" className="px-10 py-2 border-2 border-[#ef6603] bg-[#303345] text-white font-semibold rounded-full shadow-md hover:bg-[#ef6603] hover:text-white transition-all duration-300" style={{ color: "white" }}>
                  Sign Up </Link>
                <Link to="/login" className="px-10 py-2 border-2 border-[#ef6603] bg-[#303345] text-white font-semibold rounded-full shadow-md hover:bg-[#ef6603] hover:text-white transition-all duration-300" style={{ color: "white" }}>
                  Log In </Link>
              </div>
            </div>
          </div>
        </section>

      {/* About Section */}
        <section
          id="about"
          className="min-h-screen flex flex-col justify-center bg-white text-[#303345] px-10 md:px-20 py-20 scroll-mt-20 w-full" >
          
          <div className="flex flex-col md:flex-row justify-center items-start gap-10 max-w-6xl mx-auto w-full -mt-10 md:-mt-40">
            {/* Left column - About Us */}
            <div className="md:w-1/2 mt-10 md:mt-6">
              <h2 className="text-4xl font-bold mb-6 text-[#ef6603]">ABOUT US</h2>
              <p className="text-_ leading-relaxed text-justify">
                Tekton Geometrix has been delivering reliable geological and geophysical services since 2012. Our team ensures precision, accuracy, and professionalism in every project. We specialize in modern geoscientific methods, from seismology to advanced geotechnical analysis, delivering data-driven insights that support sustainable development and safety. </p>
            </div>

            {/* Right column - Vision & Mission */}
            <div className="md:w-1/2 flex flex-col justify-start border-l border-gray-400 pl-10 md:pl-16">
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-2 text-[#ff6b6b]">Vision</h3>
                <p className="text-sm leading-relaxed">
                  In the near future, we see a Philippines where the geo-resources, geohazards, and geological foundation are better known and sustainably-managed because of the clear and accurate geological, geotechnical, and geophysical information of the subsurface.</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2 text-[#ff6b6b]">Mission</h3>
                <p className="text-sm leading-relaxed">
                  We actively contribute excellent scientific instrumentation and geophysical imaging technology to facilitate the national development efforts of our clients and all Filipinos. </p>
              </div>
            </div>
          </div>
        </section>

      {/* Contact + Footer Combined */}
      <div id="contact" className="w-full bg-white text-[#313446]">
        {/* Contact Section */}
        <section className="flex flex-col md:flex-row justify-center items-start px-10 py-20 gap-10">
          {/* Contact Info */}
          <div className="md:w-[45%] space-y-2 text-sm leading-relaxed text-[#313446] md:ml-40">
            <h2 className="text-4xl font-semibold mb-2 text-[#ef6603]" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700}}>CONTACT US</h2>
            <p className="font-semibold text-xl" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700}} >TEKTON GEOMETRIX Inc.</p>
            <p>Room 319 - 320</p>
            <p>Philippine Social Science Center (PSSC)</p>
            <p>Commonwealth Ave, Quezon City, Metro Manila</p>
            <p>Phone: <span className="text-[#ff5733] font-medium">+63 2 7617 1576</span></p>
            <p>E-mail: <a href="mailto:tektongeo@gmail.com" className="text-[#ff5733] hover:underline">tektongeo@gmail.com</a></p>
            <a href="#hero" className="scroll-link mt-5 inline-block px-8 py-2 border-2 border-[#ef6603] bg-white text-[#ff5733] rounded-full hover:bg-[#ef6603] hover:!text-white transition-all duration-300 w-fit text-sm no-underline focus:outline-none focus:ring-0 visited:text-[#ff5733]" >
              Back to Top
            </a>


          </div>

          {/* Google Map */}
          <div className="md:w-[95%] h-[280px] w-full rounded-2xl overflow-hidden shadow-lg md:mr-40">
            <iframe title="Tekton GeoMetrix Location" src="https://www.google.com/maps?q=Room%20319%20-%20320,%20Philippine%20Social%20Science%20Center%20(PSSC),%20Commonwealth%20Ave,%20Quezon%20City,%20Metro%20Manila&output=embed"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative bg-white text-center pb-8 pt-16 overflow-hidden">
          {/* Top waves */}
          <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none">
            <svg
              className="block w-full h-[320px]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              style={{ transform: "translateY(-35px)" }}> 
              <path d="M0,40 C150,120 350,0 600,40 C850,80 1050,20 1200,60 V120 H0 Z" fill="#4b4e60" opacity="0.25" />
              <path d="M0,60 C200,110 400,10 600,50 C800,90 1000,30 1200,70 V120 H0 Z" fill="#4b4e60" opacity="0.5" />
              <path d="M0,80 C250,130 450,10 600,60 C750,110 950,30 1200,80 V120 H0 Z" fill="#323548" /> 
            </svg>
          </div>

          {/* Footer content */}
          <div className="relative z-10 mt-8 ">
            <div className="flex justify-center gap-4 mb-3">
              <a
                href="https://www.linkedin.com/in/tekton-geometrix-ba2b5a10a/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ef6603] hover:bg-[#ff7b64] shadow-lg transition-all duration-300"
                aria-label="Tekton Geometrix LinkedIn">
                <i className="fab fa-linkedin-in text-white text-lg"></i>
              </a>
              <a
                href="https://www.facebook.com/tekton.geometrix"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ef6603] hover:bg-[#ff7b64] shadow-lg transition-all duration-300"
                aria-label="Tekton Geometrix Facebook" >
                <i className="fab fa-facebook-f text-white text-lg"></i>
              </a>
            </div>
            <div className="inline-block bg-[#4b4e60]/90 text-white text-xs font-semibold px-6 py-1.5 rounded-full mb-2 shadow-md backdrop-blur-sm">
              TEKTON GEOMETRIX INC. </div>
            <p className="text-xs text-[10px] text-[#ffffff]/80 mt-2">
              © {new Date().getFullYear()} Tekton Geometrix. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Animation */}
      <style>
        {`
          html, body, #root {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 1.2s ease-out both;
          }
        `}
      </style>
    </div>
  );
};


export default TektonWelcome;