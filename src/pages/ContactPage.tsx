import { useState } from 'react'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Header from '../components/Header'
import PageName from '../components/PageName'
import styles from '../css/PageCss/ContactPage.module.css'
import ContactDetail from '../components/ContactDetail'
import CartSidebar from '../components/CartSideBar'
import { ToastContainer } from 'react-toastify'

function ContactPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <>
      <Header fixed={true} onCartToggle={toggleCart} />
      <PageName name='Contact' fixed={true}/>
      <ContactDetail />
      <Contact />
      <Footer />
      <CartSidebar isOpen={isCartOpen} onClose={toggleCart}/>
      {isCartOpen && <div className={styles.overlay} onClick={toggleCart}></div>}
      <ToastContainer theme="colored" />
    </>
  )
}

export default ContactPage