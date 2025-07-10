import { Image } from 'react-bootstrap';
import img1 from '../assets/spain-appetizer.jpg';
import img2 from '../assets/wine-and-cheese.jpg';
import img3 from '../assets/cups-of-coffee.jpg';
import chef from '../assets/Chef-image.jpg';
import food from '../assets/our-repcei.jpg';

function AboutDetail() {
    return (
        <div className="mt-12 md:mt-6">
            <section className="py-12 sm:py-20 px-4 sm:px-5 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm text-gray-500 tracking-wider mb-2">TASTY AND CRUNCHY</div>
                <h2 className="text-3xl md:text-5xl text-[#A2845E] mb-4 sm:mb-5 font-semibold">Our Story</h2>
                <p className="max-w-[600px] sm:max-w-[700px] mx-auto mb-8 sm:mb-12 text-gray-600 leading-relaxed text-sm sm:text-base">
                    Founded with a passion for culinary excellence, our journey began with a simple mission: to bring people together through unforgettable flavors.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                    <div className="flex flex-col items-start text-left">
                        <div className="w-full mb-4 sm:mb-5 overflow-hidden">
                            <Image
                                src={img1}
                                alt="Spanish Appetizer"
                                width={300}
                                height={250}
                                className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                        <h3 className="text-lg sm:text-xl text-gray-800 mb-2 sm:mb-3.5">Spanish Appetizer</h3>
                        <p className="text-gray-600 leading-relaxed mb-3 sm:mb-3.5 text-sm sm:text-base">
                            Our Spanish appetizers capture the vibrant essence of Mediterranean cuisine, blending bold flavors with fresh ingredients.
                        </p>
                        <a href="#" className="text-gray-800 text-xs sm:text-sm font-semibold no-underline transition-colors duration-300 hover:text-green-500">
                            READ MORE
                        </a>
                    </div>

                    <div className="flex flex-col items-start text-left">
                        <div className="w-full mb-4 sm:mb-5 overflow-hidden">
                            <Image
                                src={img2}
                                alt="Wine and Cheese"
                                width={300}
                                height={250}
                                className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                        <h3 className="text-lg sm:text-xl text-gray-800 mb-2 sm:mb-3.5">Wine and Cheese</h3>
                        <p className="text-gray-600 leading-relaxed mb-3 sm:mb-3.5 text-sm sm:text-base">
                            Indulge in our curated selection of fine wines paired with artisanal cheeses, crafted to elevate every moment into a sophisticated experience.
                        </p>
                        <a href="#" className="text-gray-800 text-xs sm:text-sm font-semibold no-underline transition-colors duration-300 hover:text-green-500">
                            READ MORE
                        </a>
                    </div>

                    <div className="flex flex-col items-start text-left">
                        <div className="w-full mb-4 sm:mb-5 overflow-hidden">
                            <Image
                                src={img3}
                                alt="Cups of Coffee"
                                width={300}
                                height={250}
                                className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                        <h3 className="text-lg sm:text-xl text-gray-800 mb-2 sm:mb-3.5">Cups of Coffee</h3>
                        <p className="text-gray-600 leading-relaxed mb-3 sm:mb-3.5 text-sm sm:text-base">
                            Savor the rich aroma and bold taste of our expertly brewed coffee, sourced from the finest beans to start your day perfectly.
                        </p>
                        <a href="#" className="text-gray-800 text-xs sm:text-sm font-semibold no-underline transition-colors duration-300 hover:text-green-500">
                            READ MORE
                        </a>
                    </div>
                </div>
            </section>

            <section className="bg-[#EBEBEB] pt-12 md:pt-0 md:px-10">
                <div className="flex flex-col sm:flex-row max-w-5xl mx-auto items-center px-4 sm:px-0">
                    <div className="flex-1 mb-8 sm:mb-0 sm:pr-8">
                        <div className="text-xs sm:text-sm text-gray-600 tracking-wider mb-2">TASTY AND CRUNCHY</div>
                        <h2 className="text-3xl md:text-5xl text-[#A2845E] font-semibold mb-2">Our Chef</h2>
                        <p className="text-sm sm:text-base text-gray-600 leading-7 font-light mb-2.5">
                            Meet our culinary visionary, whose expertise and creativity transform fresh, seasonal ingredients into dishes that delight the senses. With years of experience and a deep love for food, our chef crafts every plate with care and passion.
                        </p>
                        <button className="bg-gray-50 border border-gray-800 text-gray-800 py-2 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm tracking-wider cursor-pointer transition-all duration-300 hover:bg-gray-800 hover:text-white mt-4 sm:mt-5">
                            VIEW OUR MENU
                        </button>
                    </div>
                    <div className="flex-1 flex justify-center sm:justify-end">
                        <Image
                            src={chef}
                            alt="Chef"
                            width={517}
                            height={482}
                            className="w-full max-w-[400px] sm:max-w-[517px] h-auto"
                        />
                    </div>
                </div>
            </section>

            <section className="py-12 sm:py-20 px-4 sm:px-5 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm text-gray-500 tracking-wider mb-2">TASTY AND CRUNCHY</div>
                <h2 className="text-3xl md:text-5xl text-[#A2845E] mb-4 sm:mb-5 font-semibold">Our Specialties</h2>

                <div className="flex flex-col sm:flex-row justify-center items-center max-w-5xl mx-auto gap-6 sm:gap-8 mt-8 sm:mt-10">
                    <div className="flex justify-center gap-4 sm:gap-5">
                        <Image
                            src={food}
                            alt="Signature Dish"
                            width={483}
                            height={196}
                            className="w-full max-w-[330px] sm:max-w-[483px] h-40 sm:h-48 object-cover"
                        />
                    </div>

                    <div className="flex-1 text-left mt-6 sm:mt-0">
                        <div className="flex flex-wrap gap-4 mb-6">
                            <button className="bg-transparent border-none text-gray-800 text-xs sm:text-sm tracking-wider cursor-pointer pb-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gray-800 after:transition-all after:duration-300">
                                STARTERS
                            </button>
                            <button className="bg-transparent border-none text-gray-500 text-xs sm:text-sm tracking-wider cursor-pointer pb-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gray-800 after:transition-all after:duration-300 hover:after:w-full">
                                MAINS
                            </button>
                            <button className="bg-transparent border-none text-gray-500 text-xs sm:text-sm tracking-wider cursor-pointer pb-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gray-800 after:transition-all after:duration-300 hover:after:w-full">
                                DESSERTS
                            </button>
                        </div>

                        <div className="text-gray-600 leading-relaxed text-sm sm:text-base">
                            <p>
                                Discover our signature dishes, crafted with the finest ingredients to deliver bold flavors and unforgettable experiences. From vibrant starters to decadent desserts, each dish is a testament to our commitment to culinary excellence.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutDetail;