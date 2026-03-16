"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

type ServiceCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function ServiceCard({
  title,
  description,
  icon: Icon,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group p-8 border border-gray-200 rounded-2xl bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >

      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 mb-6 transition group-hover:bg-black group-hover:text-white">
        <Icon size={22} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>

    </motion.div>
  );
}