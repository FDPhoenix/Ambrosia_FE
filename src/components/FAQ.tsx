import { useState } from 'react';
import { BsChevronDown } from "react-icons/bs";
import { Link } from 'react-router';

const faqs = [
  {
    question: "What is the system?",
    answer:
      "Our Restaurant Management System is a comprehensive web-based application designed to streamline restaurant operations. It caters to various user roles, including Admin, Customer, Staff, Chef, and Guest. This ensures efficient management of tasks such as bookings, orders, and inventory.",
  },
  {
    question: "How does booking work?",
    answer:
      "Customers can book tables in real-time by selecting their preferred date and time. They have the option to add notes and even pre-order dishes. Cancellations can be made easily if plans change.",
  },
  {
    question: "What payment methods are available?",
    answer:
      "Our system supports multiple payment methods, including cash and credit/debit cards. This flexibility allows customers to choose the option that suits them best. Secure transactions are ensured for a smooth payment experience.",
  },
  {
    question: "Can I provide feedback?",
    answer:
      "Yes, customers can easily provide feedback on their dining experience. This can be done through their account, where they can edit or delete their comments as needed. Your insights help us improve our services.",
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="w-full bg-[#A2845E] py-10 px-4 md:px-0 md:py-14">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 md:mb-12 text-black">FAQs</h2>

        <div className="max-w-3xl mx-auto">
          <p className="text-center mb-8 text-black">
            Explore our frequently asked questions to better understand our restaurant.
          </p>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#A2845E] overflow-hidden">
                <div 
                  className="w-full p-4 flex justify-between items-center text-left bg-[#A2845E] border border-black rounded-md"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <BsChevronDown className={`transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} />
                </div>

                {openIndex === index && (
                  <div className="mt-2 px-4 pb-4 text-black">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 xl:mt-12 text-black">
          <h3 className="text-xl font-bold mb-4">Still have questions?</h3>
          <p className="mb-6">We're here to help with any inquiries you have.</p>
          <Link 
            to='/contact' 
            className="no-underline text-black py-3 px-8 border border-black rounded transition-colors duration-200 hover:bg-black hover:text-blue-100"
          >
            Contact
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FAQ