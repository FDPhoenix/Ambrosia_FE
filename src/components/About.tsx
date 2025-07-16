import { useNavigate } from "react-router";
import backgroundImage from "../assets/feature.jpg";

function About() {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate("/reservation");
  };

  return (
    <>
      <section className="bg-[#ECE6DF] pt-10 px-4 md:px-16 lg:pt-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-semibold mb-4 md:mb-6">Our Story</h1>

          <p className="text-gray-600 mb-8 text-base md:text-lg">
            Our Restaurant Management System simplifies every aspect of your restaurant, from bookings to inventory
            management. Experience seamless operations and enhanced customer satisfaction with our intuitive platform.
          </p>

          <button
            className="bg-[#1C1C1C] text-white py-3 px-8 rounded hover:opacity-90 transition-opacity duration-200"
            onClick={handleBookNow}
          >
            Reservation
          </button>
        </div>
      </section>

      <section className="bg-[#ECE6DF] py-10 px-4 md:px-16 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-0">
          <div className="flex flex-col gap-6 bg-[#f2f2f2] justify-center items-center p-6 md:p-8 md:pr-20 rounded-t-2xl md:rounded-l-2xl md:rounded-r-none h-full">
            <h2 className="text-lg font-bold md:text-2xl xl:text-3xl">
              A place that brings you wonderful culinary experiences with luxurious space and professional service.
            </h2>

            <p className="text-base md:text-lg text-[#1C1C1C]">
              Ambrosia offers a comprehensive suite of features designed for Admins, Customers,
              Staff, Chefs, and Guests. Each role benefits from a user-friendly interface that streamlines operations,
              enhances communication, and improves overall efficiency.
            </p>
          </div>

          <div
            className="bg-gray-300 aspect-square rounded-b-2xl md:rounded-r-2xl md:rounded-l-none bg-contain"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          ></div>
        </div>
      </section>
    </>
  );
}

export default About;