import { Link } from "react-router"
import { BsFacebook, BsInstagram, BsLinkedin, BsTwitter, BsYoutube } from "react-icons/bs"

function Contact() {
  return (
    <footer className="border-t border-gray-300 flex justify-between items-center text-secondary text-sm bg-[#ECE6DF]">
      <div className="w-full px-4 md:px-16">
        <div className="grid gap-4 my-4 md:grid-cols-4 lg:my-8">
          <div className="w-full justify-self-center border-b md:border-b-1 border-[#A2845E] border-dashed pb-2 md:border-none md:pb-0">
            <Link to="/" className="text-3xl font-serif block mb-2 no-underline text-black">
              Ambrosia
            </Link>
            <form className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="Your Email Here"
                className="flex-1 px-4 py-2 border border-gray-300 rounded"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded transition-opacity duration-200 hover:opacity-90"
              >
                Join
              </button>
            </form>
            
            <p className="text-secondary mb-2">
              Subscribe to our newsletter for the latest updates on features and releases.
            </p>  
          </div>

          {/* Quick Links: Ẩn trên mobile, hiện trên md trở lên */}
          <div className="hidden md:block justify-self-center">
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="list-none flex flex-col p-0 gap-2">
              <li>
                <Link to="/about" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect With Us: Ẩn trên mobile, hiện trên md trở lên */}
          <div className="hidden md:block justify-self-center">
            <h3 className="font-bold mb-4">Connect With Us</h3>
            <ul className="list-none flex flex-col p-0 gap-2">
              <li>
                <Link to="/careers" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-secondary transition-colors transition-transform duration-200 no-underline hover:text-primary hover:scale-110">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex justify-between text-center md:text-left lg:block lg:justify-self-center">
            <h3 className="font-bold mb-2 lg:mb-4">Stay Connected</h3>
            <div className="flex gap-2 lg:gap-4 justify-center md:justify-start">
              <Link to="#" className="text-secondary transition-colors transition-transform duration-200 hover:text-primary hover:scale-110">
                <BsFacebook className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-secondary transition-colors transition-transform duration-200 hover:text-primary hover:scale-110">
                <BsInstagram className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-secondary transition-colors transition-transform duration-200 hover:text-primary hover:scale-110">
                <BsTwitter className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-secondary transition-colors transition-transform duration-200 hover:text-primary hover:scale-110">
                <BsLinkedin className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-secondary transition-colors transition-transform duration-200 hover:text-primary hover:scale-110">
                <BsYoutube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Contact
