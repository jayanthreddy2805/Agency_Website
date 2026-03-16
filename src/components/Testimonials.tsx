export default function Testimonials() {
  return (
    <section id="achievements" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-gray-400">
            Trusted by startups and businesses to build powerful digital products.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">

          <div className="p-6 border border-gray-700 rounded-xl">
            <p className="text-gray-300 mb-4">
              "The team delivered an incredible website for our startup. Fast,
              modern, and exactly what we needed."
            </p>
            <h4 className="font-semibold">Sarah Johnson</h4>
            <span className="text-sm text-gray-400">Startup Founder</span>
          </div>

          <div className="p-6 border border-gray-700 rounded-xl">
            <p className="text-gray-300 mb-4">
              "Their AI solution helped automate our workflow and saved us
              hundreds of hours."
            </p>
            <h4 className="font-semibold">David Chen</h4>
            <span className="text-sm text-gray-400">Product Manager</span>
          </div>

          <div className="p-6 border border-gray-700 rounded-xl">
            <p className="text-gray-300 mb-4">
              "Professional design, great communication, and amazing results."
            </p>
            <h4 className="font-semibold">Maria Rodriguez</h4>
            <span className="text-sm text-gray-400">Marketing Director</span>
          </div>

        </div>

      </div>
    </section>
  );
}