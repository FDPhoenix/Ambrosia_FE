import BannerImg from '../assets/banner4.jpg'
import styles from '../css/Banner.module.css'

function Banner() {
  return (
    <div className="relative w-full h-screen" style={{ backgroundImage: `url(${BannerImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className='absolute w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center'>
        <div className={`text-white text-[45px] xl:text-7xl leading-[3rem] xl:leading-none ${styles.fontHerrVonMuellerhoff}`}>Welcome to</div>
        <div>
          <p className={`text-white text-center leading-[3rem] xl:leading-none uppercase text-[50px] xl:text-[100px] font-extrabold ${styles.fontCinzel}`}>Ambrosia</p>
          <p className={`text-white text-center leading-[3rem] xl:leading-none uppercase text-[30px] xl:text-[60px] font-extrabold ${styles.fontCinzel}`}>Restaurant</p>
        </div>
      </div>
    </div>
  )
}

export default Banner
