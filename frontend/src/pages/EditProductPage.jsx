import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';
import { mediaUrl } from '../lib/media';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await authFetch(`/products/${id}`);
        if (!mounted) return;
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: data.price ?? '',
          stock_quantity: data.stock_quantity ?? '',
          image: data.image || null
        });
      } catch {
        toast.error('Failed to fetch product');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload new image first (if selected)
      let image = form.image;
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

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        image
      };

      await authFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }, true);

      toast.success('✅ Product updated!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonCard count={1} />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Edit Product</h1>

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

        {/* Current image preview */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Current image</div>
          <img
            src={mediaUrl(form.image)}
            alt="Product"
            className="w-full max-h-64 object-cover rounded border"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Replace image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}