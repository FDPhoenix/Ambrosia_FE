import { useState } from 'react'
import Header from '../components/Header'
import PageName from '../components/PageName'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import CartSidebar from '../components/CartSideBar'
import styles from '../css/PageCss/MenuPage.module.css'
import AboutDetail from '../components/AboutDetail'

function AboutPage() {
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    return (
        <>
            <Header fixed={true} onCartToggle={toggleCart} />
            <PageName name='About Us' fixed={true}/>
            <AboutDetail />
            <Contact />
            <Footer />
            <CartSidebar isOpen={isCartOpen} onClose={toggleCart} />
            {isCartOpen && <div className={styles.overlay} onClick={toggleCart}></div>}
        </>
    )
}

export default AboutPage