import React from 'react';
import { motion } from 'framer-motion';

export default function Discover() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Designs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore curated collections, trending designs, and discover talented designers from our community
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for designs, designers, or styles..."
              className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700 transition">
              Search
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {['Fashion', 'Streetwear', 'Accessories', 'Sustainable']?.map((category) => (
            <motion.div
              key={category}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition"
            >
              <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800">{category}</h3>
              <p className="text-gray-600 mt-2">Explore {category?.toLowerCase()} designs</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Designs */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Designs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6]?.map((item) => (
              <motion.div
                key={item}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
              >
                <div className="h-64 bg-gradient-to-br from-pink-400 to-orange-500"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Design Title {item}</h3>
                  <p className="text-gray-600 mb-4">By Designer Name</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">View Details</span>
                    <span className="text-gray-500">❤️ 234</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}