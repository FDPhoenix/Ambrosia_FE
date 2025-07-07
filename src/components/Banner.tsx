import BannerImg from '../assets/banner3.jpg'

function Banner() {
  return (
    <div className="w-full h-[630px] bg-[#f0f0f0] mt-[72px]">
      <img
        src={BannerImg}
        alt="Restaurant hero image"
        className="w-full h-full object-fill"
      />
    </div>
  )
}

export default Banner
