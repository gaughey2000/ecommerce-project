import { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
      })
      .then(setForm)
      .catch(err => setError(err.message));
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
  
    try {
      let imagePath = form.image;
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const resUpload = await authFetch('/uploads/product', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await resUpload.json();
        if (!resUpload.ok) throw new Error(uploadData.error);
        imagePath = uploadData.image;
      }
  
      const res = await authFetch(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, image: imagePath }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
  
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Edit Product</h1>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

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
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
          className="w-full"
        />
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
          Update Product
        </button>
      </form>
    </div>
  );
}