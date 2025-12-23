import React from 'react';
import { motion } from 'framer-motion';

export default function Blog() {
  const categories = ['All', 'Fashion Tips', 'Design Process', 'Community', 'Trends', 'Tutorials'];

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Insights, tips, and stories from the world of fashion design and our creative community
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories?.map((category) => (
            <button
              key={category}
              className="px-6 py-2 rounded-full border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition font-medium"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mb-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
        >
          <div className="grid md:grid-cols-2 gap-0">
            <div className="h-96 bg-gradient-to-br from-pink-400 to-orange-500"></div>
            <div className="p-12 text-white flex flex-col justify-center">
              <span className="text-sm font-semibold mb-2">FEATURED POST</span>
              <h2 className="text-3xl font-bold mb-4">
                The Future of Sustainable Fashion Design
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Exploring how eco-friendly materials and ethical production are shaping the next generation of fashion design.
              </p>
              <div className="flex items-center text-sm mb-6">
                <span>By Sarah Johnson</span>
                <span className="mx-3">•</span>
                <span>December 20, 2025</span>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition self-start">
                Read Article →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9]?.map((item) => (
            <motion.article
              key={item}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
            >
              {/* Post Image */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-green-400"></div>

              {/* Post Content */}
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span>Fashion Tips</span>
                  <span className="mx-2">•</span>
                  <span>5 min read</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Essential Design Tips for Beginners
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn the fundamental principles that every aspiring fashion designer should know.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Alex Chen</span>
                  </div>
                  <span className="text-sm text-gray-500">Dec {item}, 2025</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
            Load More Articles
          </button>
        </div>
      </div>
    </div>
  );
}