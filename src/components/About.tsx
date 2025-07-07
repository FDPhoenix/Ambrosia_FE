import styles from '../css/About.module.css'
import { useNavigate } from "react-router";

function About() {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate("/reservation");
  };

  return (
    <>
      <section className={styles.section} style={{ paddingBottom: '0' }}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>Welcome to Ambrosia</h1>

            <p className={styles.description}>
              Our Restaurant Management System simplifies every aspect of your restaurant, from bookings to inventory
              management. Experience seamless operations and enhanced customer satisfaction with our intuitive platform.
            </p>

            <button className={styles.button} onClick={handleBookNow}>Book Now</button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.grid}>
          <div className={styles.featureContent}>
            <h2 className={styles.featureTitle}>
              A place that brings you wonderful culinary experiences with luxurious space and professional service.
            </h2>

            <p className={styles.featureDescription}>
              Ambrosia offers a comprehensive suite of features designed for Admins, Customers,
              Staff, Chefs, and Guests. Each role benefits from a user-friendly interface that streamlines operations,
              enhances communication, and improves overall efficiency.
            </p>
          </div>

          <div className={styles.imageContainer}></div>
        </div>
      </section>
    </>
  )
}

export default About
