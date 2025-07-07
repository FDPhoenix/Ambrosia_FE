import { Input } from '@mui/material';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

function ContactDetail() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    toast.success('Form submitted');
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <section className="mt-[72px] py-8 px-4 lg:mt-0 lg:py-16 lg:px-16 w-full mx-auto bg-[#EFF4F8]">
      {/* <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-light text-gray-800">
          Need Help? <span className="text-red-600 font-medium">Contact Us</span>
        </h2>
      </div> */}

      <div className="mb-12 rounded-lg overflow-hidden shadow-lg">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.053290299118!2d105.7298566740604!3d10.012457072822226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0882139720a77%3A0x3916a227d0b95a64!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgQ-G6p24gVGjGoQ!5e0!3m2!1sen!2s!4v1751207864635!5m2!1sen!2s"
          width="100%"
          height="450"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className='w-full h-[450px] border-0 rounded-lg shadow-lg'
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-[#A2845E] rounded-full p-3 flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Address</h3>
            <p className="text-gray-600">600 Nguyen Van Cu Extended Street, An Binh, Can Tho, Vietnam</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-[#A2845E] rounded-full p-3 flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Call Us</h3>
            <p className="text-gray-600">1900 678 333</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-[#A2845E] rounded-full p-3 flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Email Us</h3>
            <p className="text-gray-600">ambrosia.contact@gmail.com</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-[#A2845E] rounded-full p-3 flex-shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Opening Hours</h3>
            <p className="text-gray-600">
              <span className="font-medium">Daily:</span> 8AM - 11PM
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 lg:py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 lg:py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <Input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-2 lg:py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <textarea
              name="message"
              placeholder="Message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-2 lg:py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="text-center">
            <Button
              type="submit"
              className="bg-[#A2845E] hover:bg-red-700 text-white px-5 lg:px-8 py-2 lg:py-3 rounded-full font-medium transition-colors duration-200"
            >
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default ContactDetail