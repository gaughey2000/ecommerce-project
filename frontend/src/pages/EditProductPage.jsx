import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import SkeletonCard from '../components/SkeletonCard';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await authFetch(`/products/${id}`);
        setForm(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagePath = form.image;

      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) {
          toast.error('Invalid image file');
          setLoading(false);
          return;
        }

        if (imageFile.size > 2 * 1024 * 1024) {
          toast.error('Max image size 2MB');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await authFetch('/uploads/product', {
          method: 'POST',
          body: formData,
        });

        imagePath = uploadRes.image;
      }

      await authFetch(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, image: imagePath }),
      }, true);

      toast.success('✅ Product updated!');
      navigate('/admin');
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Edit Product</h1>

      {loading ? (
        <SkeletonCard />
      ) : (
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
            placeholder="Price"
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

          <div>
            {form.image && (
              <img src={form.image} alt="Current Product" className="w-32 h-32 object-cover mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            {loading ? 'Saving...' : 'Update Product'}
          </button>
        </form>
      )}
    </div>
  );
}