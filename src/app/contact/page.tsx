export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">

      <h1 className="text-4xl font-bold mb-8">
        Start Your Project
      </h1>

      <input
        placeholder="Your Name"
        className="w-full p-4 mb-4 bg-gray-900 rounded-lg"
      />

      <input
        placeholder="Email"
        className="w-full p-4 mb-4 bg-gray-900 rounded-lg"
      />

      <textarea
        placeholder="Tell us about your project"
        className="w-full p-4 mb-6 bg-gray-900 rounded-lg"
      />

      <button className="bg-white text-black px-8 py-3 rounded-lg">
        Send Message
      </button>

    </main>
  )
}