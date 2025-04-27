import { Heart, CalendarCheck, Mail } from "lucide-react";

const Features = () => {
  return (
    <div className="bg-gradient-to-b from-pink-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Create Your Event</h3>
            <p className="text-gray-600">Set up your occasion with multiple events like mehndi, sangeet, or reception</p>
          </div>
          <div className="text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Send Invitations</h3>
            <p className="text-gray-600">Share unique RSVP codes or links with your guests</p>
          </div>
          <div className="text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Track RSVPs</h3>
            <p className="text-gray-600">Easily manage responses and get real-time updates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
