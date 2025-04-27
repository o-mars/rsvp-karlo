import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Mail, PartyPopper, Users } from "lucide-react";

const Hero = () => {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-pink-100 opacity-70"></div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
          RSVP <span className="text-pink-600">Karlo</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The perfect way to manage RSVPs for your South Asian celebrations - from intimate mehndis to grand shaadis
        </p>
        <div className="flex justify-center gap-4 mb-12">
          <Button 
            size="lg" 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => router.push("/admin/")}
          >
            Get Started
            <PartyPopper className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <Mail className="w-8 h-8 text-pink-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-black">Custom Invitations</h3>
            <p className="text-gray-600">Send personalized digital invitations with unique RSVP codes</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <PartyPopper className="w-8 h-8 text-pink-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-black">Multiple Events</h3>
            <p className="text-gray-600">Manage all your celebration events in one place</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <Users className="w-8 h-8 text-pink-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-black">Guest Management</h3>
            <p className="text-gray-600">Track responses and manage your guest list effortlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
