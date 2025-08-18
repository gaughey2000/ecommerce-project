import { useState } from 'react';
import { authFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) Optional image upload first
      let image = null;
      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) throw new Error('Invalid image file');
        if (imageFile.size > 2 * 1024 * 1024) throw new Error('Max image size is 2MB');

        const fd = new FormData();
        fd.append('image', imageFile);

        // NOTE: fixed path -> '/uploads/products/image'
        const up = await authFetch('/uploads/products/image', {
          method: 'POST',
          body: fd
        });
        image = up?.image || null;
      }

      // 2) Create product with returned image path
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        image
      };

      await authFetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, true);

      toast.success('✅ Product added!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          step="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          name="stock_quantity"
          value={form.stock_quantity}
          onChange={handleChange}
          placeholder="Stock Quantity"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}