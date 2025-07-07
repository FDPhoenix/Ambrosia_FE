import { useState } from "react"
import Contact from "../components/Contact"
import DishMenu from "../components/DishMenu"
import Footer from "../components/Footer"
import Header from "../components/Header"
import PageName from "../components/PageName"
import styles from '../css/PageCss/MenuPage.module.css'
import CartSidebar from "../components/CartSideBar"
import SuggestDish from "../components/SuggestDish"
import cookies from 'js-cookie'

function MenuPage() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const token = cookies.get('token');

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <>
      <Header fixed={true} onCartToggle={toggleCart}/>
      <PageName name='Menus' fixed={true}/>
      <DishMenu />
      {token && <SuggestDish />}
      <Contact />
      <Footer />
      <CartSidebar isOpen={isCartOpen} onClose={toggleCart}/>
      {isCartOpen && <div className={styles.overlay} onClick={toggleCart}></div>}
    </>
  )
}

export default MenuPage
