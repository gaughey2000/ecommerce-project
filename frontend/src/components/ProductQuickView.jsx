import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../services/api';
import { toast } from 'sonner';
import AccordionSection from '../components/AccordionSection'; // ✅ Make sure this path is correct

export default function ProductQuickView({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/products/${productId}`)
      .then(setProduct)
      .catch(() => toast.error('Failed to fetch product'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = async () => {
    if (product?.sizes?.length && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product?.colours?.length && !selectedColour) {
      return toast.error('Please select a colour');
    }

    try {
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          size: selectedSize || null,
          colour: selectedColour || null,
        }),
      });
      toast.success('✅ Added to cart!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not add to cart');
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-50 flex justify-center items-center px-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>

              <img
                src={`http://localhost:3000${product.image}`}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-4"
              />

              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-lg font-semibold text-green-600 mb-2">
                £{Number(product.price).toFixed(2)}
              </p>

              {product.sizes?.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                  >
                    <option value="">Select a size</option>
                    {product.sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {product.colours?.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">Colour</label>
                  <select
                    value={selectedColour}
                    onChange={(e) => setSelectedColour(e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                  >
                    <option value="">Select a colour</option>
                    {product.colours.map((colour) => (
                      <option key={colour} value={colour}>
                        {colour}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4"
              >
                Add to Cart
              </button>

              {/* Accordion Sections */}
              <div className="mt-6">
                <AccordionSection title="Product Details">
                  {product.description || 'No description available.'}
                </AccordionSection>

                <AccordionSection title="More Info">
                  {product.more_info || 'No additional information provided.'}
                </AccordionSection>

                <AccordionSection title="Returns Policy">
                  <p>Returns are accepted within 14 days of delivery. Items must be unused and in original packaging.</p>
                </AccordionSection>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}