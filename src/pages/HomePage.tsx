import { useEffect, useState } from "react";
import About from "../components/About";
import Banner from "../components/Banner";
import FAQ from "../components/FAQ";
import Header from "../components/Header";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import ReviewExperience from "./ReviewExperience";
import styles from "../css/PageCss/HomePage.module.css";
import CartSidebar from "../components/CartSideBar";
import ChatWidget from "../components/ChatWidget";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router";

function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isReviewExperienceModalOpen, setIsReviewExperienceModalOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.showReviewExperience && location.state?.bookingId) {
      setCurrentBookingId(location.state.bookingId);
      setIsReviewExperienceModalOpen(true);
    }
  }, [location.state]);

  const closeReviewExperienceModal = () => {
    setIsReviewExperienceModalOpen(false);
    setCurrentBookingId(null);
  };
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <div>
      <Header fixed={true} onCartToggle={toggleCart} />
      <Banner />
      <About />
      <FAQ />
      <Contact />

      {isReviewExperienceModalOpen && currentBookingId ? (
        <div className={styles.modalOverlay} onClick={closeReviewExperienceModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <ReviewExperience
              bookingId={currentBookingId}
              closeModal={closeReviewExperienceModal}
            />
            <button onClick={closeReviewExperienceModal}>Close</button>
          </div>
        </div>
      ) : null}

      <CartSidebar isOpen={isCartOpen} onClose={toggleCart} />
      {isCartOpen && <div className={styles.overlay} onClick={toggleCart}></div>}
      <Footer />
      <ChatWidget />
      <ToastContainer theme="colored" />
    </div>
  );
}

export default HomePage;
