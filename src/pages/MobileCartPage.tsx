import Header from '../components/Header'
import Footer from '../components/Footer'
import MobileCart from '../components/MobileCart'
import LinkRoute from '../components/LinkRoute'
import Contact from '../components/Contact'

function MobileCartPage() {
  const links = [
    { id: 1, name: 'cart', path: '/cart' },
  ]

  return (
    <>
    <Header fixed={false} />
    <LinkRoute links={links}/>
    <MobileCart />
    <Contact />
    <Footer />
    </>
  )
}

export default MobileCartPage