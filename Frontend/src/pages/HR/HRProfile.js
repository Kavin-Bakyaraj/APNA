import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function HRProfile() {
  const [hrProfile, setHRProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHRProfile();
  }, []);

  const fetchHRProfile = async () => {
    setLoading(true);
    setError("");

    const token = Cookies.get("jwt");

    if (!token) {
      toast.error("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/apna/get_hr_profile/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setHRProfile(data);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-[#190A28] mb-4 text-center">HR Profile</h2>

        {loading ? (
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-lg font-semibold text-[#190A28]">Name:</p>
              <p className="text-gray-700">{hrProfile.name}</p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-lg font-semibold text-[#190A28]">Email:</p>
              <p className="text-gray-700">{hrProfile.email}</p>
            </div>

            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-lg font-semibold text-[#190A28]">Company Name:</p>
              <p className="text-gray-700">{hrProfile.companyname || "N/A" }</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
