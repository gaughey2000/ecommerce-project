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
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    if (form.price <= 0 || form.stock_quantity < 0) {
      toast.error('Price must be positive and stock cannot be negative.');
      setLoading(false);
      return;
    }

    try {
      let imagePath = '';
      if (image) {
        if (!image.type.startsWith('image/')) {
          toast.error('Please upload a valid image file.');
          setLoading(false);
          return;
        }
        if (image.size > 2 * 1024 * 1024) {
          toast.error('Image must be under 2MB.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', image);
        const uploadData = await authFetch('/uploads/product', {
          method: 'POST',
          body: formData,
          headers: {}, // override default JSON header for FormData
        });
        imagePath = uploadData.image;
      }

      await authFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify({ ...form, image_url: imagePath }),
      });

      toast.success('✅ Product created!');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price (e.g., 19.99)"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          name="stock_quantity"
          value={form.stock_quantity}
          onChange={handleChange}
          placeholder="Stock quantity"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}